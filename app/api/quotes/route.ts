import { NextResponse } from "next/server";

const BASE = "https://finnhub.io/api/v1";
const MAX_TICKERS = 12;

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

  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const response = await fetch(
          `${BASE}/quote?symbol=${encodeURIComponent(ticker)}&token=${key}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;

        const data = (await response.json()) as FinnhubQuote;
        if (typeof data.c !== "number" || data.c <= 0) return;

        quotes[ticker] = {
          ticker,
          price: data.c,
          change: data.d ?? 0,
          changePct: data.dp ?? 0,
          previousClose: data.pc ?? data.c,
          high: data.h ?? data.c,
          low: data.l ?? data.c,
        };
      } catch {
        // skip tickers that fail so one bad symbol doesn't break the batch
      }
    }),
  );

  return NextResponse.json(
    { quotes, source: "finnhub", fetchedAt: Date.now() },
    { headers },
  );
}
