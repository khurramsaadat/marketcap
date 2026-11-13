"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CandleChart, type Candle } from "@/components/candle-chart";
import { ChangeArrow, StockLogo } from "@/components/icons";
import { StockActions } from "@/components/stock-actions";
import { formatCurrency, formatPercent } from "@/lib/dashboard-data";
import { UpdatedAgo } from "@/components/updated-ago";
import { useLiveQuotes } from "@/lib/use-live-quotes";

type Profile = {
  ticker: string;
  name: string | null;
  exchange: string | null;
  industry: string | null;
  country: string | null;
  currency: string | null;
  ipo: string | null;
  website: string | null;
  marketCap: string | null;
  pe: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  beta: number | null;
  dividendYield: number | null;
};

type NewsItem = {
  title: string;
  source: string;
  summary: string;
  url: string;
  datetime: number | null;
};

type CandleRange = "1d" | "5d" | "1mo";

const CANDLE_RANGES: { key: CandleRange; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "5d", label: "5D" },
  { key: "1mo", label: "1M" },
];

type CandleState = {
  available: boolean;
  reason?: string;
  candles?: Candle[];
  interval?: string;
  timeZone?: string;
  source?: string;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className="mt-1 text-[14px] font-medium text-ink tabular-nums">{value}</dd>
    </div>
  );
}

export function StockDetail({ ticker: rawTicker }: { ticker: string }) {
  const ticker = rawTicker.toUpperCase();

  const { quotes, updatedAt } = useLiveQuotes([ticker]);
  const quote = quotes[ticker];

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [range, setRange] = useState<CandleRange>("1d");
  const [charts, setCharts] = useState<Record<string, CandleState>>({});

  useEffect(() => {
    let active = true;

    fetch(`/api/profile?symbol=${encodeURIComponent(ticker)}`)
      .then((response) => response.json())
      .then((data: { profile?: Profile | null }) => {
        if (!active) return;
        if (data.profile) setProfile(data.profile);
        else setProfileMissing(true);
      })
      .catch(() => {
        if (active) setProfileMissing(true);
      });

    fetch(`/api/news?symbol=${encodeURIComponent(ticker)}`)
      .then((response) => response.json())
      .then((data: { items?: NewsItem[] }) => {
        if (active) setNews(data.items ?? []);
      })
      .catch(() => {
        // empty list is shown when Finnhub has no headlines
      });

    return () => {
      active = false;
    };
  }, [ticker]);

  const chartKey = `${ticker}:${range}`;
  const candles = charts[chartKey] ?? null;

  useEffect(() => {
    let active = true;

    fetch(`/api/candles?symbol=${encodeURIComponent(ticker)}&range=${range}`)
      .then((response) => response.json())
      .then((data: CandleState) => {
        if (active) setCharts((current) => ({ ...current, [chartKey]: data }));
      })
      .catch(() => {
        if (active) {
          setCharts((current) => ({
            ...current,
            [chartKey]: { available: false, reason: "network-error" },
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [ticker, range, chartKey]);

  if (profileMissing && !quote) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-10 text-center">
        <p className="text-[15px] font-medium text-ink">No live data for {ticker}</p>
        <p className="mt-1 text-[13px] text-muted">
          Finnhub returned no profile or quote for this symbol.
        </p>
      </div>
    );
  }

  const name = profile?.name ?? ticker;
  const up = (quote?.changePct ?? 0) >= 0;

  return (
    <>
      <Link href="/" className="text-[13px] font-medium text-muted hover:text-ink">
        ← Overview
      </Link>

      <section className="mt-3 rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-4">
            <StockLogo ticker={ticker} size="size-14" />
            <div>
              <p className="text-[20px] font-semibold tracking-tight text-ink">{ticker}</p>
              <p className="text-[13px] text-muted">{name}</p>
              <p className="mt-1 text-[12px] text-faint">
                {[profile?.industry, profile?.exchange].filter(Boolean).join(" · ") ||
                  "Fetching company profile…"}
              </p>
            </div>
          </div>

          {quote ? <StockActions ticker={ticker} price={quote.price} /> : null}
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-3">
          <p className="text-[36px] font-semibold leading-none tracking-tight text-ink tabular-nums">
            {quote ? formatCurrency(quote.price) : "—"}
          </p>
          {quote ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-medium ${
                up ? "bg-up-soft text-up" : "bg-down-soft text-down"
              }`}
            >
              <ChangeArrow up={up} className="size-3" />
              {formatPercent(quote.changePct)} today
            </span>
          ) : null}
        </div>

        <div className="mt-2">
          <UpdatedAgo at={updatedAt} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
          <Stat
            label="Day range"
            value={quote ? `${quote.low.toFixed(2)} – ${quote.high.toFixed(2)}` : "—"}
          />
          <Stat label="Previous close" value={quote ? formatCurrency(quote.previousClose) : "—"} />
          <Stat
            label="52-week range"
            value={
              profile?.yearLow && profile?.yearHigh
                ? `${profile.yearLow.toFixed(2)} – ${profile.yearHigh.toFixed(2)}`
                : "—"
            }
          />
          <Stat label="Market cap" value={profile?.marketCap ?? "—"} />
          <Stat label="P/E ratio" value={profile?.pe ? profile.pe.toFixed(1) : "—"} />
          <Stat label="Beta" value={profile?.beta ? profile.beta.toFixed(2) : "—"} />
          <Stat
            label="Dividend yield"
            value={profile?.dividendYield ? `${profile.dividendYield.toFixed(2)}%` : "—"}
          />
          <Stat label="IPO" value={profile?.ipo ?? "—"} />
        </dl>
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-ink">Price history</h2>
          <div
            role="group"
            aria-label="Chart range"
            className="flex items-center gap-1 rounded-full bg-surface-muted p-1"
          >
            {CANDLE_RANGES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                aria-pressed={range === key}
                className={`rounded-full px-3 py-1 text-[11.5px] font-medium transition-colors ${
                  range === key
                    ? "bg-surface text-ink shadow-sm"
                    : "text-muted hover:text-ink-soft"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {candles?.available && candles.candles?.length ? (
          <div className="mt-4">
            <CandleChart
              candles={candles.candles}
              range={range}
              timeZone={candles.timeZone}
            />
            <p className="mt-2 text-[11px] text-faint">
              {candles.interval} candles from Yahoo Finance · exchange time · may
              be delayed
            </p>
          </div>
        ) : (
          <div className="mt-4 flex h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 text-center">
            <p className="text-[13.5px] font-medium text-ink">
              {candles ? "No candle data available" : "Loading price history…"}
            </p>
            {candles && !candles.available ? (
              <p className="mt-1 max-w-[420px] text-[12px] leading-relaxed text-muted">
                {candles.reason === "throttled"
                  ? "Yahoo Finance rate-limited the request. The chart will fill in on the next try."
                  : "No intraday candles came back for this symbol. The market may be closed or the symbol unsupported."}
              </p>
            ) : null}
          </div>
        )}
      </section>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <h2 className="text-[16px] font-semibold text-ink">News</h2>
          {news.length === 0 ? (
            <p className="mt-4 text-[13px] text-muted">
              No recent headlines for {ticker} from Finnhub.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-line">
              {news.slice(0, 6).map((item) => (
                <article key={item.url} className="py-4 first:pt-0 last:pb-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[14px] font-medium leading-snug text-ink hover:text-accent"
                  >
                    {item.title}
                  </a>
                  {item.summary ? (
                    <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                      {item.summary}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[11.5px] text-faint">
                    {item.source}
                    {item.datetime
                      ? ` · ${new Date(item.datetime * 1000).toLocaleDateString()}`
                      : ""}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <h2 className="text-[16px] font-semibold text-ink">Company</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-4 text-[13px]">
              <dt className="text-muted">Industry</dt>
              <dd className="text-right font-medium text-ink">{profile?.industry ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 text-[13px]">
              <dt className="text-muted">Exchange</dt>
              <dd className="text-right font-medium text-ink">{profile?.exchange ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 text-[13px]">
              <dt className="text-muted">Country</dt>
              <dd className="text-right font-medium text-ink">{profile?.country ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 text-[13px]">
              <dt className="text-muted">Currency</dt>
              <dd className="text-right font-medium text-ink">{profile?.currency ?? "—"}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 text-[13px]">
              <dt className="text-muted">Website</dt>
              <dd className="text-right font-medium text-accent">
                {profile?.website ? (
                  <a href={profile.website} target="_blank" rel="noreferrer">
                    {profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  );
}
