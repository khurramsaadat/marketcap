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
const BATCH_SIZE = 12;

type QuotesResponse = { quotes?: Record<string, LiveQuote> };

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

    const list = key.split(",").filter(Boolean);
    const batches: string[][] = [];
    for (let index = 0; index < list.length; index += BATCH_SIZE) {
      batches.push(list.slice(index, index + BATCH_SIZE));
    }

    const load = async () => {
      try {
        const responses = await Promise.all(
          batches.map((batch) =>
            fetch(`/api/quotes?tickers=${encodeURIComponent(batch.join(","))}`, {
              cache: "no-store",
            })
              .then((response) => (response.ok ? (response.json() as Promise<QuotesResponse>) : null))
              .catch(() => null),
          ),
        );

        if (!active) return;

        const merged: Record<string, LiveQuote> = {};
        for (const data of responses) {
          if (data?.quotes) Object.assign(merged, data.quotes);
        }
        if (Object.keys(merged).length === 0) return;

        setQuotes((current) => ({ ...current, ...merged }));
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
