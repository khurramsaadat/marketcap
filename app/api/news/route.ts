import { NextResponse } from "next/server";

const BASE = "https://finnhub.io/api/v1";
const MAX_ITEMS = 12;

type FinnhubNews = {
  headline?: string;
  source?: string;
  summary?: string;
  url?: string;
  datetime?: number;
  related?: string;
};

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").trim().toUpperCase();
  const key = process.env.FINNHUB_API_KEY;
  const headers = { "cache-control": "no-store" };

  if (!key) {
    return NextResponse.json({ items: [], source: "unconfigured" }, { headers });
  }

  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 7);

  const url = /^[A-Z.]{1,8}$/.test(symbol)
    ? `${BASE}/company-news?symbol=${encodeURIComponent(symbol)}&from=${isoDate(from)}&to=${isoDate(now)}&token=${key}`
    : `${BASE}/news?category=general&token=${key}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        { items: [], source: "finnhub-error" },
        { headers },
      );
    }

    const data = (await response.json()) as FinnhubNews[];
    const items = (Array.isArray(data) ? data : [])
      .filter((item) => item.headline && item.url)
      .slice(0, MAX_ITEMS)
      .map((item) => ({
        title: item.headline as string,
        source: item.source ?? "Finnhub",
        summary: item.summary ?? "",
        url: item.url as string,
        datetime: item.datetime ?? null,
        ticker: item.related ?? null,
      }));

    return NextResponse.json(
      { items, source: "finnhub", fetchedAt: Date.now() },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { items: [], source: "network-error" },
      { headers },
    );
  }
}
