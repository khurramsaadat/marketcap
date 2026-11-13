"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { ChangeArrow, PlusIcon, SearchIcon, StockLogo } from "@/components/icons";
import { UpdatedAgo } from "@/components/updated-ago";
import { formatCurrency, formatPercent } from "@/lib/dashboard-data";
import { findQuote, quotes } from "@/lib/market-data";
import { PORTFOLIO_KEY, seedPositions, type Position } from "@/lib/stores";
import { useLiveQuotes, type LiveQuote } from "@/lib/use-live-quotes";
import { useLocalStore } from "@/lib/use-local-store";

const gridCols =
  "grid-cols-[minmax(170px,1.3fr)_repeat(5,minmax(92px,0.8fr))_minmax(96px,0.9fr)_36px]";

const today = () => new Date().toISOString().slice(0, 10);

function livePrice(live?: LiveQuote) {
  return live && live.price > 0 ? live.price : undefined;
}

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

const fieldClass =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13.5px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60 focus:ring-2 focus:ring-accent/10";
const labelClass = "mb-1.5 block text-[12px] font-medium text-muted";

export default function PortfolioPage() {
  const [positions, setPositions] = useLocalStore<Position>(
    PORTFOLIO_KEY,
    seedPositions,
  );
  const { quotes: liveQuotes, updatedAt } = useLiveQuotes(
    positions.map((position) => position.ticker),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    { ticker: string; name: string }[]
  >([]);
  const [draft, setDraft] = useState({
    ticker: "",
    quantity: "",
    costBasis: "",
    purchaseDate: "",
    targetPrice: "",
  });

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (trimmedQuery.length < 2) return;
    let active = true;

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          results?: { ticker: string; name: string }[];
        };
        if (active) setSuggestions((data.results ?? []).slice(0, 6));
      } catch {
        // leave the previous suggestions in place
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [trimmedQuery]);

  const visiblePositions = useMemo(() => {
    if (!trimmedQuery) return positions;
    const term = trimmedQuery.toLowerCase();
    return positions.filter((position) => {
      const name = findQuote(position.ticker)?.name?.toLowerCase() ?? "";
      return (
        position.ticker.toLowerCase().includes(term) || name.includes(term)
      );
    });
  }, [positions, trimmedQuery]);

  const totals = useMemo(() => {
    let invested = 0;
    let value = 0;

    for (const position of positions) {
      const price = livePrice(liveQuotes[position.ticker]);
      if (price === undefined) continue;
      invested += position.costBasis;
      value += price * position.quantity;
    }

    return {
      invested,
      value,
      gain: value - invested,
      gainPct: invested > 0 ? ((value - invested) / invested) * 100 : 0,
    };
  }, [positions, liveQuotes]);

  const addPosition = (event: FormEvent) => {
    event.preventDefault();
    const ticker = draft.ticker.trim().toUpperCase();
    const quantity = Number(draft.quantity);
    const costBasis = Number(draft.costBasis);

    if (!ticker) {
      setFormError("Enter a ticker symbol.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError("Quantity must be greater than zero.");
      return;
    }
    if (!Number.isFinite(costBasis) || costBasis < 0) {
      setFormError("Cost basis must be zero or more.");
      return;
    }
    setFormError(null);

    setPositions((current) => [
      ...current,
      {
        id: `${ticker}-${Date.now()}`,
        ticker,
        quantity,
        costBasis,
        purchaseDate: draft.purchaseDate || today(),
        targetPrice: draft.targetPrice ? Number(draft.targetPrice) : null,
      },
    ]);
    setDraft({
      ticker: "",
      quantity: "",
      costBasis: "",
      purchaseDate: today(),
      targetPrice: "",
    });
    setFormOpen(false);
  };

  const removePosition = (id: string) => {
    setPositions((current) => current.filter((position) => position.id !== id));
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink">
            Portfolio
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Positions, cost basis and target prices — saved in this browser until
            sign-in is connected.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((open) => !open)}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-[13px] font-medium text-on-accent shadow-[0_6px_16px_rgba(108,59,244,0.28)] transition-colors hover:bg-accent-strong"
        >
          <PlusIcon />
          Add position
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Current value" value={formatCurrency(totals.value)} />
        <SummaryTile label="Total invested" value={formatCurrency(totals.invested)} />
        <SummaryTile
          label="Total gain / loss"
          value={formatCurrency(totals.gain)}
          trend={totals.gain}
          trendPct={totals.gainPct}
        />
        <SummaryTile label="Positions" value={String(positions.length)} />
      </div>

      {formOpen ? (
        <form
          onSubmit={addPosition}
          className="mt-5 rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
        >
          <h2 className="text-[15px] font-semibold text-ink">New position</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className={labelClass} htmlFor="ticker">
                Ticker
              </label>
              <input
                id="ticker"
                list="ticker-options"
                required
                value={draft.ticker}
                onChange={(event) =>
                  setDraft({ ...draft, ticker: event.target.value.toUpperCase() })
                }
                placeholder="AAPL"
                className={fieldClass}
              />
              <datalist id="ticker-options">
                {quotes.map((quote) => (
                  <option key={quote.ticker} value={quote.ticker}>
                    {quote.name}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelClass} htmlFor="quantity">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min="0"
                step="any"
                required
                value={draft.quantity}
                onChange={(event) =>
                  setDraft({ ...draft, quantity: event.target.value })
                }
                placeholder="10"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="costBasis">
                Cost basis (total)
              </label>
              <input
                id="costBasis"
                type="number"
                min="0"
                step="any"
                required
                value={draft.costBasis}
                onChange={(event) =>
                  setDraft({ ...draft, costBasis: event.target.value })
                }
                placeholder="1850"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="purchaseDate">
                Purchase date
              </label>
              <input
                id="purchaseDate"
                type="date"
                value={draft.purchaseDate}
                onChange={(event) =>
                  setDraft({ ...draft, purchaseDate: event.target.value })
                }
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="targetPrice">
                Target price
              </label>
              <input
                id="targetPrice"
                type="number"
                min="0"
                step="any"
                value={draft.targetPrice}
                onChange={(event) =>
                  setDraft({ ...draft, targetPrice: event.target.value })
                }
                placeholder="Optional"
                className={fieldClass}
              />
            </div>
          </div>
          {formError ? (
            <p className="mt-3 text-[12px] text-down" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="mt-5 flex items-center gap-2.5">
            <button
              type="submit"
              className="h-10 rounded-full bg-accent px-5 text-[13px] font-medium text-on-accent transition-colors hover:bg-accent-strong"
            >
              Save position
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="h-10 rounded-full border border-line bg-surface px-5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <section className="mt-5 rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[16px] font-semibold text-ink">My Stock</h2>
            {positions.length > 0 ? (
              <UpdatedAgo at={updatedAt} className="text-[11.5px] text-faint" />
            ) : null}
            {positions.length > 0 &&
            positions.some((p) => livePrice(liveQuotes[p.ticker]) === undefined) ? (
              <span className="text-[11.5px] text-faint">
                Some positions have no live quote yet
              </span>
            ) : null}
          </div>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stocks or positions"
              aria-label="Search portfolio"
              className="h-9 w-full rounded-full border border-line bg-surface py-1 pl-9 pr-3 text-[12.5px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60 focus:ring-2 focus:ring-accent/10 sm:w-64"
            />
          </div>
        </div>

        {trimmedQuery.length >= 2 && suggestions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => {
              const held = positions.some(
                (position) => position.ticker === suggestion.ticker,
              );

              return (
                <button
                  key={suggestion.ticker}
                  type="button"
                  onClick={() => {
                    setDraft({ ...draft, ticker: suggestion.ticker });
                    setFormOpen(true);
                  }}
                  className="flex max-w-[240px] items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:bg-surface-muted"
                >
                  <span className="font-semibold text-ink">{suggestion.ticker}</span>
                  <span className="truncate text-muted">{suggestion.name}</span>
                  <PlusIcon className="size-3 shrink-0 text-accent" />
                  {held ? (
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-faint">
                      Held
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {positions.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-line px-6 py-10 text-center">
            <p className="text-[14px] font-medium text-ink">No positions yet</p>
            <p className="mt-1 text-[13px] text-muted">
              Add your first position to start tracking performance against a
              target.
            </p>
          </div>
        ) : visiblePositions.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-line px-6 py-8 text-center">
            <p className="text-[14px] font-medium text-ink">
              No positions match “{trimmedQuery}”
            </p>
            <p className="mt-1 text-[13px] text-muted">
              Use the suggestions above to add a new stock, or clear the search.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[880px]">
              <div
                className={`grid ${gridCols} items-center gap-3 px-1 pb-2 text-[13px] font-medium text-muted`}
              >
                <span>Name Stock</span>
                <span>Quantity</span>
                <span>Cost basis</span>
                <span>Purchase date</span>
                <span>Target</span>
                <span>Value</span>
                <span>Gain / loss</span>
                <span />
              </div>

              {visiblePositions.map((position) => {
                const price = livePrice(liveQuotes[position.ticker]);
                const value = price === undefined ? undefined : price * position.quantity;
                const gain = value === undefined ? undefined : value - position.costBasis;
                const gainPct =
                  gain !== undefined && position.costBasis > 0
                    ? (gain / position.costBasis) * 100
                    : 0;
                const up = (gain ?? 0) >= 0;
                const targetHit =
                  price !== undefined &&
                  position.targetPrice !== null &&
                  price >= position.targetPrice;

                return (
                  <div
                    key={position.id}
                    className={`grid ${gridCols} items-center gap-3 border-t border-line px-1 py-3.5`}
                  >
                    <Link
                      href={`/stocks/${position.ticker}`}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <StockLogo ticker={position.ticker} size="size-9" />
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold leading-tight text-ink">
                          {position.ticker}
                        </span>
                        <span className="block truncate text-[12px] text-muted">
                          {findQuote(position.ticker)?.name ?? "Custom holding"}
                        </span>
                      </span>
                    </Link>
                    <span className="text-[13.5px] text-ink-soft tabular-nums">
                      {position.quantity}
                    </span>
                    <span className="text-[13.5px] text-ink-soft tabular-nums">
                      {formatCurrency(position.costBasis)}
                    </span>
                    <span className="text-[13.5px] text-ink-soft">
                      {formatDate(position.purchaseDate)}
                    </span>
                    <span>
                      {position.targetPrice === null ? (
                        <span className="text-[13px] text-faint">—</span>
                      ) : (
                        <span className="flex flex-col gap-1">
                          <span className="text-[13.5px] text-ink-soft tabular-nums">
                            {formatCurrency(position.targetPrice)}
                          </span>
                          {targetHit ? (
                            <span className="w-fit rounded-full bg-up-soft px-2 py-0.5 text-[10.5px] font-medium text-up">
                              Target hit
                            </span>
                          ) : null}
                        </span>
                      )}
                    </span>
                    <span className="text-[13.5px] font-semibold text-ink tabular-nums">
                      {value === undefined ? "—" : formatCurrency(value)}
                    </span>
                    {gain === undefined ? (
                      <span className="text-[12px] text-faint">No quote</span>
                    ) : (
                      <span
                        className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ${
                          up ? "bg-up-soft text-up" : "bg-down-soft text-down"
                        }`}
                      >
                        <ChangeArrow up={up} className="size-3" />
                        {formatPercent(gainPct)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePosition(position.id)}
                      aria-label={`Remove ${position.ticker}`}
                      className="flex size-8 items-center justify-center rounded-full text-faint transition-colors hover:bg-down-soft hover:text-down"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function SummaryTile({
  label,
  value,
  trend,
  trendPct,
}: {
  label: string;
  value: string;
  trend?: number;
  trendPct?: number;
}) {
  const showTrend = typeof trend === "number" && typeof trendPct === "number";
  const up = showTrend ? trend! >= 0 : true;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-2 text-[22px] font-semibold tracking-tight text-ink tabular-nums">
        {value}
      </p>
      {showTrend ? (
        <p
          className={`mt-1 inline-flex items-center gap-1 text-[12px] font-medium ${
            up ? "text-up" : "text-down"
          }`}
        >
          <ChangeArrow up={up} className="size-3" />
          {formatPercent(trendPct!)}
        </p>
      ) : null}
    </div>
  );
}
