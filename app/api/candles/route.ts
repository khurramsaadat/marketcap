import { NextResponse } from "next/server";

/**
 * Finnhub's free plan returns 403 for /stock/candle, so intraday candles come
 * from Yahoo Finance's public chart endpoint instead. No key, no signup.
 * Personal use only — a commercial deployment needs a licensed feed.
 */
const YAHOO = "https://query1.finance.yahoo.com/v8/finance/chart";

const RANGES = {
  "1d": { range: "1d", interval: "5m" },
  "5d": { range: "5d", interval: "15m" },
  "1mo": { range: "1mo", interval: "60m" },
} as const;

type RangeKey = keyof typeof RANGES;

/** Yahoo throttles aggressive clients; a generous cache keeps us polite. */
const TTL_MS = 45_000;
const STALE_MS = 10 * 60_000;

type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

type Payload = {
  available: boolean;
  reason?: string;
  candles?: Candle[];
  previousClose?: number | null;
  interval?: string;
  timeZone?: string;
  source?: string;
};

type YahooChart = {
  chart?: {
    result?: {
      meta?: {
        chartPreviousClose?: number;
        previousClose?: number;
        exchangeTimezoneName?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: {
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }[];
      };
    }[];
    error?: { code?: string; description?: string } | null;
  };
};

type CacheEntry = { payload: Payload; at: number };

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<Payload>>();

function parse(symbol: string, data: YahooChart, interval: string): Payload {
  const result = data.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const times = result?.timestamp;

  if (!result || !quote || !times?.length) {
    return { available: false, reason: "no-data" };
  }

  const candles: Candle[] = [];
  for (let index = 0; index < times.length; index++) {
    const open = quote.open?.[index];
    const high = quote.high?.[index];
    const low = quote.low?.[index];
    const close = quote.close?.[index];

    // Yahoo pads holidays and halted sessions with nulls.
    if (
      typeof open !== "number" ||
      typeof high !== "number" ||
      typeof low !== "number" ||
      typeof close !== "number"
    ) {
      continue;
    }

    const volume = quote.volume?.[index] ?? 0;
    // Yahoo appends a zero-volume placeholder at the live price; skip it so the
    // chart does not end in a flat stub.
    if (volume === 0 && open === high && high === low && low === close) continue;

    candles.push({
      t: times[index] * 1000,
      o: open,
      h: high,
      l: low,
      c: close,
      v: volume,
    });
  }

  if (candles.length === 0) return { available: false, reason: "no-data" };

  return {
    available: true,
    candles,
    interval,
    previousClose: result.meta?.chartPreviousClose ?? result.meta?.previousClose ?? null,
    timeZone: result.meta?.exchangeTimezoneName ?? "America/New_York",
    source: "yahoo",
  };
}

async function fetchCandles(symbol: string, range: RangeKey): Promise<Payload> {
  const { range: span, interval } = RANGES[range];
  const url = `${YAHOO}/${encodeURIComponent(symbol)}?interval=${interval}&range=${span}&includePrePost=false`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        // Yahoo returns 401 to clients without a browser-looking agent.
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        available: false,
        reason: response.status === 429 ? "throttled" : "unavailable",
      };
    }

    return parse(symbol, (await response.json()) as YahooChart, interval);
  } catch {
    return { available: false, reason: "network-error" };
  }
}

function loadCandles(symbol: string, range: RangeKey): Promise<Payload> {
  const cacheKey = `${symbol}:${range}`;
  const pending = inflight.get(cacheKey);
  if (pending) return pending;

  const promise = fetchCandles(symbol, range).finally(() => {
    inflight.delete(cacheKey);
  });

  inflight.set(cacheKey, promise);
  return promise;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").trim().toUpperCase();
  const requested = (searchParams.get("range") ?? "1d").toLowerCase();
  const range: RangeKey = requested in RANGES ? (requested as RangeKey) : "1d";

  const headers = { "cache-control": "no-store" };

  if (!/^[A-Z.^-]{1,12}$/.test(symbol)) {
    return NextResponse.json({ available: false, reason: "bad-symbol" }, { headers });
  }

  const cacheKey = `${symbol}:${range}`;
  const entry = cache.get(cacheKey);

  if (entry && Date.now() - entry.at < TTL_MS) {
    return NextResponse.json(
      { ...entry.payload, cached: true, asOf: entry.at },
      { headers },
    );
  }

  const payload = await loadCandles(symbol, range);

  if (payload.available) {
    const at = Date.now();
    cache.set(cacheKey, { payload, at });
    return NextResponse.json({ ...payload, cached: false, asOf: at }, { headers });
  }

  // Keep the last good series for a while rather than blanking the chart.
  if (entry && Date.now() - entry.at < STALE_MS) {
    return NextResponse.json(
      { ...entry.payload, cached: true, asOf: entry.at },
      { headers },
    );
  }

  return NextResponse.json(payload, { headers });
}
