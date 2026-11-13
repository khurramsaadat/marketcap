"use client";

import { StockCard } from "@/components/stock-card";
import { useLiveQuotes } from "@/lib/use-live-quotes";
import type { StockHolding } from "@/lib/dashboard-data";

export function LiveHoldings({ holdings }: { holdings: StockHolding[] }) {
  const { quotes } = useLiveQuotes(holdings.map((holding) => holding.ticker));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {holdings.map((holding) => {
        const live = quotes[holding.ticker];
        const card = live
          ? { ...holding, value: live.price, changePct: live.changePct }
          : holding;

        return <StockCard key={holding.ticker} holding={card} />;
      })}
    </div>
  );
}
