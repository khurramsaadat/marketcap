"use client";

import { useState } from "react";
import { useLocalStore } from "@/lib/use-local-store";
import {
  PORTFOLIO_KEY,
  WATCHLIST_KEY,
  seedPositions,
  seedWatchlist,
  type Position,
} from "@/lib/stores";

export function StockActions({
  ticker,
  price,
}: {
  ticker: string;
  price: number;
}) {
  const [watchlist, setWatchlist] = useLocalStore<string>(
    WATCHLIST_KEY,
    seedWatchlist,
  );
  const [positions, setPositions] = useLocalStore<Position>(
    PORTFOLIO_KEY,
    seedPositions,
  );
  const [message, setMessage] = useState<string | null>(null);

  const inWatchlist = watchlist.includes(ticker);
  const inPortfolio = positions.some((position) => position.ticker === ticker);

  const toggleWatchlist = () => {
    setWatchlist((current) =>
      current.includes(ticker)
        ? current.filter((item) => item !== ticker)
        : [...current, ticker],
    );
    setMessage(inWatchlist ? "Removed from watchlist" : "Added to watchlist");
  };

  const addToPortfolio = () => {
    if (inPortfolio) {
      setMessage("Already in your portfolio");
      return;
    }
    setPositions((current) => [
      ...current,
      {
        id: `${ticker}-${Date.now()}`,
        ticker,
        quantity: 1,
        costBasis: price,
        purchaseDate: new Date().toISOString().slice(0, 10),
        targetPrice: null,
      },
    ]);
    setMessage("Added 1 share at the current price");
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={toggleWatchlist}
          className={`h-10 rounded-full px-5 text-[13px] font-medium transition-colors ${
            inWatchlist
              ? "border border-line bg-surface-muted text-ink-soft"
              : "border border-line bg-surface text-ink-soft hover:bg-surface-muted"
          }`}
        >
          {inWatchlist ? "In watchlist" : "Add to watchlist"}
        </button>
        <button
          type="button"
          onClick={addToPortfolio}
          className="h-10 rounded-full bg-accent px-5 text-[13px] font-medium text-on-accent shadow-[0_6px_16px_rgba(108,59,244,0.28)] transition-colors hover:bg-accent-strong"
        >
          Add to portfolio
        </button>
      </div>
      {message ? (
        <p className="text-[12px] text-muted" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
