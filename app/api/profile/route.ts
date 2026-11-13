import { NextResponse } from "next/server";

const BASE = "https://finnhub.io/api/v1";

type FinnhubProfile = {
  name?: string;
  ticker?: string;
  exchange?: string;
  finnhubIndustry?: string;
  marketCapitalization?: number;
  shareOutstanding?: number;
  logo?: string;
  weburl?: string;
  currency?: string;
  ipo?: string;
  country?: string;
};

type FinnhubMetrics = {
  metric?: Record<string, number | null>;
};

function formatCap(millions?: number) {
  if (!millions || millions <= 0) return null;
  const value = millions * 1_000_000;
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  return String(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").trim().toUpperCase();
  const key = process.env.FINNHUB_API_KEY;
  const headers = { "cache-control": "no-store" };

  if (!key) {
    return NextResponse.json({ profile: null, source: "unconfigured" }, { headers });
  }
  if (!/^[A-Z.]{1,8}$/.test(symbol)) {
    return NextResponse.json({ profile: null, source: "bad-symbol" }, { headers });
  }

  const encoded = encodeURIComponent(symbol);

  const [profileResult, metricResult] = await Promise.allSettled([
    fetch(`${BASE}/stock/profile2?symbol=${encoded}&token=${key}`, { cache: "no-store" }),
    fetch(`${BASE}/stock/metric?symbol=${encoded}&metric=all&token=${key}`, {
      cache: "no-store",
    }),
  ]);

  let profile: FinnhubProfile = {};
  if (profileResult.status === "fulfilled" && profileResult.value.ok) {
    profile = (await profileResult.value.json()) as FinnhubProfile;
  }

  let metric: Record<string, number | null> = {};
  if (metricResult.status === "fulfilled" && metricResult.value.ok) {
    const data = (await metricResult.value.json()) as FinnhubMetrics;
    metric = data.metric ?? {};
  }

  if (!profile.name && Object.keys(metric).length === 0) {
    return NextResponse.json({ profile: null, source: "not-found" }, { headers });
  }

  const number = (value: number | null | undefined) =>
    typeof value === "number" && Number.isFinite(value) ? value : null;

  return NextResponse.json(
    {
      profile: {
        ticker: profile.ticker ?? symbol,
        name: profile.name ?? null,
        exchange: profile.exchange ?? null,
        industry: profile.finnhubIndustry ?? null,
        country: profile.country ?? null,
        currency: profile.currency ?? null,
        ipo: profile.ipo ?? null,
        website: profile.weburl ?? null,
        logo: profile.logo ?? null,
        marketCap: formatCap(profile.marketCapitalization),
        marketCapMillions: number(profile.marketCapitalization),
        sharesOutstanding: number(profile.shareOutstanding),
        pe: number(metric["peBasicExclExtraTTM"]) ?? number(metric["peTTM"]),
        yearHigh: number(metric["52WeekHigh"]),
        yearLow: number(metric["52WeekLow"]),
        beta: number(metric["beta"]),
        dividendYield: number(metric["dividendYieldIndicatedAnnual"]),
      },
      source: "finnhub",
    },
    { headers },
  );
}
