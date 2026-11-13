"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { ChangeArrow, PlusIcon, StockLogo } from "@/components/icons";
import { formatCurrency, formatPercent } from "@/lib/dashboard-data";
import { findQuote, quotes } from "@/lib/market-data";
import { WATCHLIST_KEY, seedWatchlist } from "@/lib/stores";
import { UpdatedAgo } from "@/components/updated-ago";
import { useLiveQuotes } from "@/lib/use-live-quotes";
import { useLocalStore } from "@/lib/use-local-store";

export default function WatchlistPage() {
  const [tickers, setTickers] = useLocalStore<string>(WATCHLIST_KEY, seedWatchlist);
  const { quotes: liveQuotes, updatedAt } = useLiveQuotes(tickers);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const addTicker = (event: FormEvent) => {
    event.preventDefault();
    const ticker = draft.trim().toUpperCase();
    if (!ticker) return;

    if (!/^[A-Z][A-Z.-]{0,9}$/.test(ticker)) {
      setMessage("Use a ticker symbol such as AAPL or BRK.B.");
      return;
    }
    if (tickers.includes(ticker)) {
      setMessage(`${ticker} is already on your watchlist.`);
      setDraft("");
      return;
    }

    setTickers([...tickers, ticker]);
    setMessage(`${ticker} added to your watchlist.`);
    setDraft("");
  };

  const remove = (ticker: string) => {
    setTickers(tickers.filter((item) => item !== ticker));
    setMessage(`${ticker} removed from your watchlist.`);
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink">
            My Stock
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Everything you are keeping an eye on, in one list.
          </p>
          <div className="mt-1">
            <UpdatedAgo at={updatedAt} />
          </div>
        </div>
        <form onSubmit={addTicker} className="flex items-center gap-2">
          <input
            list="watchlist-options"
            value={draft}
            onChange={(event) => setDraft(event.target.value.toUpperCase())}
            placeholder="Add ticker"
            aria-label="Add ticker"
            className="h-10 w-40 rounded-full border border-line bg-surface px-4 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60 focus:ring-2 focus:ring-accent/10"
          />
          <datalist id="watchlist-options">
            {quotes.map((quote) => (
              <option key={quote.ticker} value={quote.ticker}>
                {quote.name}
              </option>
            ))}
          </datalist>
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-[13px] font-medium text-on-accent shadow-[0_6px_16px_rgba(108,59,244,0.28)] transition-colors hover:bg-accent-strong"
          >
            <PlusIcon />
            Add
          </button>
        </form>
      </div>

      {message ? (
        <p className="mt-2 text-[12px] text-muted" role="status">
          {message}
        </p>
      ) : null}

      <section className="mt-5 rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <h2 className="text-[16px] font-semibold text-ink">Watchlist</h2>

        {tickers.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-line px-6 py-10 text-center">
            <p className="text-[14px] font-medium text-ink">Your watchlist is empty</p>
            <p className="mt-1 text-[13px] text-muted">
              Add a ticker above to start following it.
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-line">
            {tickers.map((ticker) => {
              const quote = findQuote(ticker);
              const live = liveQuotes[ticker];
              const price = live?.price;
              const changePct = live?.changePct;
              const up = (changePct ?? 0) >= 0;

              return (
                <div
                  key={ticker}
                  className="flex flex-wrap items-center gap-4 py-3.5"
                >
                  <Link
                    href={`/stocks/${ticker}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <StockLogo ticker={ticker} size="size-9" />
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold leading-tight text-ink">
                        {ticker}
                      </span>
                      <span className="block truncate text-[12px] text-muted">
                        {quote?.name ?? "Open quote"}
                      </span>
                    </span>
                  </Link>

                  <span className="w-28 text-right text-[14px] font-semibold text-ink tabular-nums">
                    {typeof price === "number" ? formatCurrency(price) : "—"}
                  </span>

                  <span
                    className={`inline-flex w-24 items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ${
                      up ? "bg-up-soft text-up" : "bg-down-soft text-down"
                    }`}
                  >
                    <ChangeArrow up={up} className="size-3" />
                    {typeof changePct === "number" ? formatPercent(changePct) : "—"}
                  </span>

                  <button
                    type="button"
                    onClick={() => remove(ticker)}
                    aria-label={`Remove ${ticker}`}
                    className="flex size-8 items-center justify-center rounded-full text-faint transition-colors hover:bg-down-soft hover:text-down"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
