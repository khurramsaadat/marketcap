"use client";

import { useEffect, useMemo, useState } from "react";
import { PortfolioValues } from "@/components/portfolio-values";
import { StatisticsChart } from "@/components/statistics-chart";
import { StockCard } from "@/components/stock-card";
import { StockTable, type StockRowData } from "@/components/stock-table";
import { findQuote } from "@/lib/market-data";
import { PORTFOLIO_KEY, seedPositions, type Position } from "@/lib/stores";
import { UpdatedAgo } from "@/components/updated-ago";
import { useLiveQuotes } from "@/lib/use-live-quotes";
import { useLocalStore } from "@/lib/use-local-store";
import { recordValue, useValueHistory } from "@/lib/use-value-history";

const MARKET_WATCH = ["AAPL", "MSFT", "NVDA", "AMZN"];

export type SortMode = "none" | "top" | "worst";

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
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
  const { quotes, updatedAt } = useLiveQuotes(tickers);
  const history = useValueHistory();
  const [sortMode, setSortMode] = useState<SortMode>("none");

  const totals = useMemo(() => {
    let invested = 0;
    let value = 0;
    let pricedCount = 0;

    for (const position of positions) {
      const price = quotes[position.ticker]?.price;
      // A position without a quote is excluded from both sides of the maths so a
      // pending fetch never reads as a total loss.
      if (price === undefined) continue;
      invested += position.costBasis;
      value += price * position.quantity;
      pricedCount += 1;
    }

    return {
      invested,
      value,
      pricedCount,
      gain: value - invested,
      gainPct: invested > 0 ? ((value - invested) / invested) * 100 : 0,
    };
  }, [positions, quotes]);

  useEffect(() => {
    const allPriced = positions.length > 0 && totals.pricedCount === positions.length;
    if (allPriced) recordValue(totals.value);
  }, [positions.length, totals.pricedCount, totals.value]);

  const rows: StockRowData[] = positions.map((position) => {
    const price = quotes[position.ticker]?.price;
    const value = price === undefined ? undefined : price * position.quantity;
    const changePct =
      value === undefined
        ? undefined
        : position.costBasis > 0
          ? ((value - position.costBasis) / position.costBasis) * 100
          : 0;

    return {
      id: position.id,
      ticker: position.ticker,
      name: findQuote(position.ticker)?.name ?? position.ticker,
      investDate: formatDate(position.purchaseDate),
      quantity: position.quantity,
      changePct,
      price,
    };
  });

  const sortedRows = useMemo(() => {
    if (sortMode === "none") return rows;
    const direction = sortMode === "top" ? -1 : 1;
    return [...rows].sort((a, b) => {
      if (a.changePct === undefined) return 1;
      if (b.changePct === undefined) return -1;
      return (a.changePct - b.changePct) * direction;
    });
  }, [rows, sortMode]);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
        <span>Live prices from Finnhub</span>
        <span className="text-faint">·</span>
        <UpdatedAgo at={updatedAt} className="text-[12.5px] text-faint" />
      </div>

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
          pricedCount={totals.pricedCount}
          sortMode={sortMode}
          onSort={setSortMode}
        />
        <StatisticsChart series={history} />
      </div>

      <div className="mt-5">
        <StockTable rows={sortedRows} />
      </div>
    </>
  );
}
