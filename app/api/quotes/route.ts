import { NextResponse } from "next/server";

const BASE = "https://finnhub.io/api/v1";
const MAX_TICKERS = 12;

/**
 * Fresh window: anything requested inside this window is served from the last
 * upstream result. Finnhub allows 60 calls/minute for the whole key, and every
 * ticker costs one call, so this is what keeps 30-second polling affordable
 * when several tabs (or visitors) ask for the same symbols.
 */
const TTL_MS = 20_000;

/** A failed upstream call may fall back to a quote this old before giving up. */
const STALE_MS = 5 * 60_000;

/** Guardrail so a long-running server never grows this map without bound. */
const MAX_CACHE_ENTRIES = 500;

type FinnhubQuote = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  pc?: number;
  t?: number;
};

type QuotePayload = {
  ticker: string;
  price: number;
  change: number;
  changePct: number;
  previousClose: number;
  high: number;
  low: number;
};

type CacheEntry = { quote: QuotePayload; at: number };

// Module scope: kept warm per server instance (a serverless instance starts
// empty, which is fine — the cache is an optimisation, not a source of truth).
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<QuotePayload | null>>();

function pruneCache(now: number) {
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  for (const [ticker, entry] of cache) {
    if (now - entry.at > STALE_MS) cache.delete(ticker);
  }
}

async function fetchQuote(
  ticker: string,
  key: string,
): Promise<QuotePayload | null> {
  try {
    const response = await fetch(
      `${BASE}/quote?symbol=${encodeURIComponent(ticker)}&token=${key}`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;

    const data = (await response.json()) as FinnhubQuote;
    if (typeof data.c !== "number" || data.c <= 0) return null;

    return {
      ticker,
      price: data.c,
      change: data.d ?? 0,
      changePct: data.dp ?? 0,
      previousClose: data.pc ?? data.c,
      high: data.h ?? data.c,
      low: data.l ?? data.c,
    };
  } catch {
    return null;
  }
}

/** Shares one upstream call between concurrent requests for the same symbol. */
function loadQuote(ticker: string, key: string): Promise<QuotePayload | null> {
  const pending = inflight.get(ticker);
  if (pending) return pending;

  const promise = fetchQuote(ticker, key).finally(() => {
    inflight.delete(ticker);
  });

  inflight.set(ticker, promise);
  return promise;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const tickers = Array.from(
    new Set(
      (searchParams.get("tickers") ?? "")
        .split(",")
        .map((ticker) => ticker.trim().toUpperCase())
        .filter((ticker) => /^[A-Z.]{1,8}$/.test(ticker)),
    ),
  ).slice(0, MAX_TICKERS);

  const key = process.env.FINNHUB_API_KEY;
  const headers = { "cache-control": "no-store" };

  if (!key) {
    return NextResponse.json({ quotes: {}, source: "unconfigured" }, { headers });
  }

  if (tickers.length === 0) {
    return NextResponse.json({ quotes: {}, source: "no-tickers" }, { headers });
  }

  const quotes: Record<string, QuotePayload> = {};
  let cached = 0;
  let oldest = Date.now();

  await Promise.all(
    tickers.map(async (ticker) => {
      const entry = cache.get(ticker);

      if (entry && Date.now() - entry.at < TTL_MS) {
        quotes[ticker] = entry.quote;
        cached += 1;
        oldest = Math.min(oldest, entry.at);
        return;
      }

      const fresh = await loadQuote(ticker, key);

      if (fresh) {
        const at = Date.now();
        cache.set(ticker, { quote: fresh, at });
        quotes[ticker] = fresh;
        return;
      }

      // Finnhub failed (often a 429). A slightly old price is better than
      // dropping the row, so serve the last known one while it is still recent.
      if (entry && Date.now() - entry.at < STALE_MS) {
        quotes[ticker] = entry.quote;
        cached += 1;
        oldest = Math.min(oldest, entry.at);
      }
    }),
  );

  pruneCache(Date.now());

  return NextResponse.json(
    {
      quotes,
      source: "finnhub",
      fetchedAt: Object.keys(quotes).length > 0 ? oldest : Date.now(),
      cached,
    },
    { headers },
  );
}
