import Link from "next/link";
import {
  ChangeArrow,
  ChevronRightIcon,
  KebabIcon,
  SparkleIcon,
} from "@/components/icons";
import { formatCurrency, formatPercent } from "@/lib/dashboard-data";
import type { SortMode } from "@/components/dashboard-live";

type PortfolioValuesProps = {
  total: number;
  gain: number;
  gainPct: number;
  positions: number;
  pricedCount: number;
  sortMode: SortMode;
  onSort: (mode: SortMode) => void;
};

export function PortfolioValues({
  total,
  gain,
  gainPct,
  positions,
  pricedCount,
  sortMode,
  onSort,
}: PortfolioValuesProps) {
  const hasPositions = positions > 0;
  const waiting = hasPositions && pricedCount === 0;
  const partial = hasPositions && pricedCount > 0 && pricedCount < positions;
  const up = gain >= 0;

  return (
    <section className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-start justify-between">
        <h2 className="text-[16px] font-semibold text-ink">Portfolio Values</h2>
        <span
          aria-hidden="true"
          className="flex size-7 items-center justify-center text-faint"
        >
          <KebabIcon />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-[34px] font-semibold leading-none tracking-tight text-ink tabular-nums">
          {waiting ? "—" : formatCurrency(total)}
        </p>
        {hasPositions && !waiting ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ${
              up ? "bg-up-soft text-up" : "bg-down-soft text-down"
            }`}
          >
            <ChangeArrow up={up} className="size-3" />
            {formatPercent(gainPct)}
          </span>
        ) : null}
      </div>

      <p className="mt-4 max-w-[320px] text-[13px] leading-relaxed text-muted">
        {!hasPositions
          ? "Add a position to track its value and gain against cost basis using live prices."
          : waiting
            ? "Waiting for live quotes from Finnhub before showing totals."
            : `You're ${up ? "up" : "down"} ${formatCurrency(Math.abs(gain))} across ${positions} ${
                positions === 1 ? "position" : "positions"
              }, priced live from Finnhub.`}
      </p>

      {partial ? (
        <p className="mt-2 text-[11.5px] text-faint">
          {positions - pricedCount} of {positions} positions have no quote yet and
          are excluded from these totals.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => onSort(sortMode === "worst" ? "none" : "worst")}
          aria-pressed={sortMode === "worst"}
          disabled={!hasPositions}
          className={`h-10 rounded-full px-5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            sortMode === "worst"
              ? "border border-accent/30 bg-accent-soft text-accent"
              : "border border-line bg-white text-ink-soft hover:bg-[#f8f9fa]"
          }`}
        >
          Worst Performance
        </button>
        <button
          type="button"
          onClick={() => onSort(sortMode === "top" ? "none" : "top")}
          aria-pressed={sortMode === "top"}
          disabled={!hasPositions}
          className={`h-10 rounded-full px-5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            sortMode === "top"
              ? "bg-[#5f31e0] text-white shadow-[0_6px_16px_rgba(108,59,244,0.28)]"
              : "bg-accent text-white shadow-[0_6px_16px_rgba(108,59,244,0.28)] hover:bg-[#5f31e0]"
          }`}
        >
          Top Performance
        </button>
      </div>

      <div className="mt-auto pt-5">
        <Link
          href="/portfolio"
          className="flex w-full items-center gap-3 rounded-2xl bg-accent-soft p-3.5 text-left transition-colors hover:bg-[#eae2fd]"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#7c5cfc]">
            <SparkleIcon className="size-[18px]" />
          </span>
          <span className="flex-1 text-[12.5px] leading-snug text-[#5b4ba8]">
            Here&apos;s to improve your portfolio and understanding how investing
            works.
          </span>
          <ChevronRightIcon className="size-4 shrink-0 text-[#7c6be0]" />
        </Link>
      </div>
    </section>
  );
}
