import { NextResponse } from "next/server";

const BASE = "https://finnhub.io/api/v1";
const MAX_RESULTS = 10;

type FinnhubSearchResult = {
  displaySymbol?: string;
  description?: string;
  type?: string;
};

type FinnhubSearch = {
  count?: number;
  result?: FinnhubSearchResult[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const key = process.env.FINNHUB_API_KEY;
  const headers = { "cache-control": "no-store" };

  if (!key || query.length < 1) {
    return NextResponse.json({ results: [], source: key ? "no-query" : "unconfigured" }, { headers });
  }

  try {
    const response = await fetch(
      `${BASE}/search?q=${encodeURIComponent(query)}&token=${key}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      return NextResponse.json({ results: [], source: "finnhub-error" }, { headers });
    }

    const data = (await response.json()) as FinnhubSearch;
    const results = (data.result ?? [])
      .filter((item) => item.displaySymbol && item.type === "Common Stock")
      .slice(0, MAX_RESULTS)
      .map((item) => ({
        ticker: item.displaySymbol as string,
        name: item.description ?? (item.displaySymbol as string),
        type: item.type ?? "Common Stock",
      }));

    return NextResponse.json({ results, source: "finnhub" }, { headers });
  } catch {
    return NextResponse.json({ results: [], source: "network-error" }, { headers });
  }
}
