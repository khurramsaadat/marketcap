"use client";

import { useEffect, useState } from "react";

export type LiveQuote = {
  ticker: string;
  price: number;
  change: number;
  changePct: number;
  previousClose: number;
  high: number;
  low: number;
};

const POLL_MS = 60_000;

export function useLiveQuotes(tickers: string[]) {
  const key = tickers
    .map((ticker) => ticker.toUpperCase())
    .filter(Boolean)
    .sort()
    .join(",");

  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!key) return;
    let active = true;

    const load = async () => {
      try {
        const response = await fetch(
          `/api/quotes?tickers=${encodeURIComponent(key)}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;

        const data = (await response.json()) as {
          quotes?: Record<string, LiveQuote>;
        };
        if (!active || !data.quotes) return;

        setQuotes((current) => ({ ...current, ...data.quotes }));
        setUpdatedAt(Date.now());
      } catch {
        // keep the last known prices when the network is unavailable
      }
    };

    void load();
    const interval = window.setInterval(load, POLL_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [key]);

  return { quotes, updatedAt };
}
