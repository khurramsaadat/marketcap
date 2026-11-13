"use client";

import { useEffect, useMemo } from "react";
import { PortfolioValues } from "@/components/portfolio-values";
import { StatisticsChart } from "@/components/statistics-chart";
import { StockCard } from "@/components/stock-card";
import { StockTable, type StockRowData } from "@/components/stock-table";
import { findQuote } from "@/lib/market-data";
import { PORTFOLIO_KEY, seedPositions, type Position } from "@/lib/stores";
import { useLiveQuotes } from "@/lib/use-live-quotes";
import { useLocalStore } from "@/lib/use-local-store";
import { recordValue, useValueHistory } from "@/lib/use-value-history";

const MARKET_WATCH = ["AAPL", "MSFT", "NVDA", "AMZN"];

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DashboardLive() {
  const [positions] = useLocalStore<Position>(PORTFOLIO_KEY, seedPositions);
  const tickers = useMemo(
    () => Array.from(new Set([...MARKET_WATCH, ...positions.map((p) => p.ticker)])),
    [positions],
  );
  const { quotes } = useLiveQuotes(tickers);
  const history = useValueHistory();

  const totals = useMemo(() => {
    const invested = positions.reduce((sum, p) => sum + p.costBasis, 0);
    const value = positions.reduce(
      (sum, p) => sum + (quotes[p.ticker]?.price ?? 0) * p.quantity,
      0,
    );
    return {
      invested,
      value,
      gain: value - invested,
      gainPct: invested > 0 ? ((value - invested) / invested) * 100 : 0,
    };
  }, [positions, quotes]);

  useEffect(() => {
    if (positions.length > 0) recordValue(totals.value);
  }, [positions.length, totals.value]);

  const rows: StockRowData[] = positions.map((position) => {
    const price = quotes[position.ticker]?.price;
    const value = (price ?? 0) * position.quantity;
    return {
      ticker: position.ticker,
      name: findQuote(position.ticker)?.name ?? "Tracked position",
      investDate: formatDate(position.purchaseDate),
      quantity: position.quantity,
      changePct:
        position.costBasis > 0 ? ((value - position.costBasis) / position.costBasis) * 100 : 0,
      price,
    };
  });

  return (
    <>
      <p className="mb-3 text-[12.5px] text-muted">
        Live prices from Finnhub, refreshed every 60 seconds.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MARKET_WATCH.map((ticker) => {
          const quote = quotes[ticker];
          return (
            <StockCard
              key={ticker}
              ticker={ticker}
              name={findQuote(ticker)?.name ?? ticker}
              price={quote?.price}
              changePct={quote?.changePct}
            />
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <PortfolioValues
          total={totals.value}
          gain={totals.gain}
          gainPct={totals.gainPct}
          positions={positions.length}
        />
        <StatisticsChart series={history} />
      </div>

      <div className="mt-5">
        <StockTable rows={rows} />
      </div>
    </>
  );
}
