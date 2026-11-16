import { NextResponse } from "next/server";

const URL_BASE = "https://api.coingecko.com/api/v3/simple/price";

/**
 * CoinGecko's free Demo plan allows ~10,000 calls/month and a handful per
 * minute. A 10-minute server cache caps this route at ~144 upstream calls a
 * day (4,320/month) no matter how many tabs are open, which leaves headroom
 * for the standalone `scripts/price_alert.py` watcher on the same IP.
 */
const TTL_MS = 10 * 60_000;

/** Serve a recent value rather than nothing when CoinGecko rate-limits us. */
const STALE_MS = 60 * 60_000;

type CoinPayload = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change24hPct: number;
  lastUpdated: number;
};

type CacheEntry = { coin: CoinPayload; at: number };

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CoinPayload | null>>();

async function fetchCoin(id: string): Promise<CoinPayload | null> {
  try {
    const url =
      `${URL_BASE}?ids=${encodeURIComponent(id)}&vs_currencies=usd` +
      "&include_24hr_change=true&include_last_updated_at=true";

    const response = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as Record<
      string,
      { usd?: number; usd_24h_change?: number; last_updated_at?: number }
    >;

    const entry = data[id];
    if (!entry || typeof entry.usd !== "number" || entry.usd <= 0) return null;

    const changePct = typeof entry.usd_24h_change === "number" ? entry.usd_24h_change : 0;

    return {
      id,
      symbol: id === "bitcoin" ? "BTC" : id.toUpperCase(),
      name: id === "bitcoin" ? "Bitcoin" : id,
      price: entry.usd,
      change24h: (entry.usd * changePct) / 100,
      change24hPct: changePct,
      lastUpdated: (entry.last_updated_at ?? Math.floor(Date.now() / 1000)) * 1000,
    };
  } catch {
    return null;
  }
}

function loadCoin(id: string): Promise<CoinPayload | null> {
  const pending = inflight.get(id);
  if (pending) return pending;

  const promise = fetchCoin(id).finally(() => inflight.delete(id));
  inflight.set(id, promise);
  return promise;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get("id") ?? "bitcoin").toLowerCase();
  const headers = { "cache-control": "no-store" };

  if (!/^[a-z0-9-]{2,40}$/.test(id)) {
    return NextResponse.json({ error: "invalid coin id" }, { status: 400, headers });
  }

  const cached = cache.get(id);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return NextResponse.json(
      { coin: cached.coin, source: "coingecko", fetchedAt: cached.at, cached: true },
      { headers },
    );
  }

  const fresh = await loadCoin(id);
  if (fresh) {
    const at = Date.now();
    cache.set(id, { coin: fresh, at });
    return NextResponse.json(
      { coin: fresh, source: "coingecko", fetchedAt: at, cached: false },
      { headers },
    );
  }

  if (cached && Date.now() - cached.at < STALE_MS) {
    return NextResponse.json(
      { coin: cached.coin, source: "coingecko-stale", fetchedAt: cached.at, cached: true },
      { headers },
    );
  }

  return NextResponse.json(
    { coin: null, error: "unavailable" },
    { status: 503, headers },
  );
}
