import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ChangeArrow, StockLogo } from "@/components/icons";
import { LineChart } from "@/components/line-chart";
import { StockActions } from "@/components/stock-actions";
import { formatCurrency, formatPercent } from "@/lib/dashboard-data";
import { findQuote, newsFor, priceHistory, quotes } from "@/lib/market-data";

const historyLabels = ["9:30", "11:00", "12:30", "2:00", "3:30"];

export function generateStaticParams() {
  return quotes.map((quote) => ({ ticker: quote.ticker }));
}


export default async function StockPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const quote = findQuote(ticker);

  if (!quote) notFound();

  const up = quote.changePct >= 0;
  const history = priceHistory(quote);
  const lo = Math.min(...history) * 0.985;
  const hi = Math.max(...history) * 1.015;
  const ticks = Array.from(
    { length: 4 },
    (_, i) => lo + ((hi - lo) / 3) * i,
  );
  const news = newsFor(quote);

  const stats = [
    { label: "Market cap", value: quote.marketCap },
    { label: "P/E ratio", value: quote.pe.toFixed(1) },
    { label: "Day range", value: `${quote.dayLow.toFixed(2)} – ${quote.dayHigh.toFixed(2)}` },
    { label: "52-week range", value: `${quote.yearLow.toFixed(2)} – ${quote.yearHigh.toFixed(2)}` },
  ];

  return (
    <AppShell>
      <Link href="/" className="text-[13px] font-medium text-muted hover:text-ink">
        ← Overview
      </Link>

      <section className="mt-3 rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-4">
            <StockLogo ticker={quote.ticker} size="size-14" />
            <div>
              <p className="text-[20px] font-semibold tracking-tight text-ink">
                {quote.ticker}
              </p>
              <p className="text-[13px] text-muted">{quote.name}</p>
              <p className="mt-1 text-[12px] text-faint">{quote.sector}</p>
            </div>
          </div>

          <StockActions ticker={quote.ticker} price={quote.price} />
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-3">
          <p className="text-[36px] font-semibold leading-none tracking-tight text-ink tabular-nums">
            {formatCurrency(quote.price)}
          </p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-medium ${
              up ? "bg-up-soft text-up" : "bg-down-soft text-down"
            }`}
          >
            <ChangeArrow up={up} className="size-3" />
            {formatPercent(quote.changePct)} today
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-[12px] text-muted">{stat.label}</dt>
              <dd className="mt-1 text-[14px] font-medium text-ink tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-ink">Price history</h2>
          <span className="rounded-full bg-[#f8f9fa] px-3 py-1 text-[11.5px] font-medium text-muted">
            1D
          </span>
        </div>
        <div className="mt-4">
          <LineChart
            id={`${quote.ticker}-price`}
            values={history}
            labels={historyLabels}
            labelEvery={6}
            min={lo}
            max={hi}
            ticks={ticks}
            tickFormat={(value) => `$${value.toFixed(0)}`}
            stroke={up ? "#4fd1a5" : "#f7a2b6"}
            fillTop={up ? "#8ce8c4" : "#f7a8bb"}
          />
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <h2 className="text-[16px] font-semibold text-ink">News</h2>
          <div className="mt-4 divide-y divide-line">
            {news.map((item) => (
              <article key={item.title} className="py-4 first:pt-0 last:pb-0">
                <p className="text-[14px] font-medium leading-snug text-ink">
                  {item.title}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                  {item.summary}
                </p>
                <p className="mt-2 text-[11.5px] text-faint">
                  {item.source} · {item.date}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <h2 className="text-[16px] font-semibold text-ink">About</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            {quote.about}
          </p>
          <dl className="mt-5 space-y-3 border-t border-line pt-4">
            <div className="flex items-center justify-between text-[13px]">
              <dt className="text-muted">Sector</dt>
              <dd className="font-medium text-ink">{quote.sector}</dd>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <dt className="text-muted">Market cap</dt>
              <dd className="font-medium text-ink">{quote.marketCap}</dd>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <dt className="text-muted">P/E ratio</dt>
              <dd className="font-medium text-ink">{quote.pe.toFixed(1)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </AppShell>
  );
}
