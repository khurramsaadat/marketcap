import { NextResponse } from "next/server";

const BASE = "https://finnhub.io/api/v1";

type FinnhubCandles = {
  s?: string;
  c?: number[];
  t?: number[];
  error?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").trim().toUpperCase();
  const key = process.env.FINNHUB_API_KEY;
  const headers = { "cache-control": "no-store" };

  if (!key) {
    return NextResponse.json({ available: false, reason: "unconfigured" }, { headers });
  }
  if (!/^[A-Z.]{1,8}$/.test(symbol)) {
    return NextResponse.json({ available: false, reason: "bad-symbol" }, { headers });
  }

  const to = Math.floor(Date.now() / 1000);
  const from = to - 60 * 60 * 8;

  try {
    const response = await fetch(
      `${BASE}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=5&from=${from}&to=${to}&token=${key}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { available: false, reason: response.status === 403 ? "plan" : "error" },
        { headers },
      );
    }

    const data = (await response.json()) as FinnhubCandles;
    if (data.s !== "ok" || !data.c?.length || !data.t?.length) {
      return NextResponse.json({ available: false, reason: "no-data" }, { headers });
    }

    return NextResponse.json(
      { available: true, closes: data.c, timestamps: data.t, source: "finnhub" },
      { headers },
    );
  } catch {
    return NextResponse.json({ available: false, reason: "network-error" }, { headers });
  }
}
