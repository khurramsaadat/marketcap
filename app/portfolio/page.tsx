"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { ChangeArrow, PlusIcon, StockLogo } from "@/components/icons";
import { formatCurrency, formatPercent } from "@/lib/dashboard-data";
import { findQuote, quotes } from "@/lib/market-data";
import { PORTFOLIO_KEY, seedPositions, type Position } from "@/lib/stores";
import { useLiveQuotes, type LiveQuote } from "@/lib/use-live-quotes";
import { useLocalStore } from "@/lib/use-local-store";

const gridCols =
  "grid-cols-[minmax(170px,1.3fr)_repeat(5,minmax(92px,0.8fr))_minmax(96px,0.9fr)_36px]";

const today = () => new Date().toISOString().slice(0, 10);

function priceOf(position: Position, live?: LiveQuote) {
  if (live && live.price > 0) return live.price;
  const quote = findQuote(position.ticker);
  if (quote) return quote.price;
  return position.quantity > 0 ? position.costBasis / position.quantity : 0;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const fieldClass =
  "h-10 w-full rounded-xl border border-line bg-white px-3 text-[13.5px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60 focus:ring-2 focus:ring-accent/10";
const labelClass = "mb-1.5 block text-[12px] font-medium text-muted";

export default function PortfolioPage() {
  const [positions, setPositions] = useLocalStore<Position>(
    PORTFOLIO_KEY,
    seedPositions,
  );
  const { quotes: liveQuotes } = useLiveQuotes(
    positions.map((position) => position.ticker),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState({
    ticker: "",
    quantity: "",
    costBasis: "",
    purchaseDate: "",
    targetPrice: "",
  });

  const totals = useMemo(() => {
    const invested = positions.reduce((sum, p) => sum + p.costBasis, 0);
    const value = positions.reduce(
      (sum, p) => sum + priceOf(p, liveQuotes[p.ticker]) * p.quantity,
      0,
    );
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
    if (!ticker || !Number.isFinite(quantity) || quantity <= 0) return;
    if (!Number.isFinite(costBasis) || costBasis < 0) return;

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
          className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-[13px] font-medium text-white shadow-[0_6px_16px_rgba(108,59,244,0.28)] transition-colors hover:bg-[#5f31e0]"
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
          className="mt-5 rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
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
          <div className="mt-5 flex items-center gap-2.5">
            <button
              type="submit"
              className="h-10 rounded-full bg-accent px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#5f31e0]"
            >
              Save position
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="h-10 rounded-full border border-line bg-white px-5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-[#f8f9fa]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <section className="mt-5 rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <h2 className="text-[16px] font-semibold text-ink">My Stock</h2>

        {positions.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-line px-6 py-10 text-center">
            <p className="text-[14px] font-medium text-ink">No positions yet</p>
            <p className="mt-1 text-[13px] text-muted">
              Add your first position to start tracking performance against a
              target.
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

              {positions.map((position) => {
                const price = priceOf(position, liveQuotes[position.ticker]);
                const value = price * position.quantity;
                const gain = value - position.costBasis;
                const gainPct =
                  position.costBasis > 0 ? (gain / position.costBasis) * 100 : 0;
                const up = gain >= 0;
                const targetHit =
                  position.targetPrice !== null && price >= position.targetPrice;

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
                      {formatCurrency(value)}
                    </span>
                    <span
                      className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ${
                        up ? "bg-up-soft text-up" : "bg-down-soft text-down"
                      }`}
                    >
                      <ChangeArrow up={up} className="size-3" />
                      {formatPercent(gainPct)}
                    </span>
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
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
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
