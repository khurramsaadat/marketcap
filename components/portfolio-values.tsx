import {
  ChangeArrow,
  ChevronRightIcon,
  KebabIcon,
  SparkleIcon,
} from "@/components/icons";
import { formatCurrency, formatPercent } from "@/lib/dashboard-data";

type PortfolioValuesProps = {
  total: number;
  gain: number;
  gainPct: number;
  positions: number;
};

export function PortfolioValues({
  total,
  gain,
  gainPct,
  positions,
}: PortfolioValuesProps) {
  const up = gain >= 0;

  return (
    <section className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-start justify-between">
        <h2 className="text-[16px] font-semibold text-ink">Portfolio Values</h2>
        <button
          type="button"
          aria-label="Portfolio options"
          className="flex size-7 items-center justify-center rounded-lg text-faint transition-colors hover:bg-[#f2f3f5] hover:text-ink-soft"
        >
          <KebabIcon />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-[34px] font-semibold leading-none tracking-tight text-ink tabular-nums">
          {formatCurrency(total)}
        </p>
        {positions > 0 ? (
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
        {positions > 0
          ? `You're ${up ? "up" : "down"} ${formatCurrency(Math.abs(gain))} across ${positions} ${
              positions === 1 ? "position" : "positions"
            }, priced live from Finnhub.`
          : "Add a position to track its value and gain against cost basis using live prices."}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          className="h-10 rounded-full border border-line bg-white px-5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-[#f8f9fa]"
        >
          Worst Performance
        </button>
        <button
          type="button"
          className="h-10 rounded-full bg-accent px-5 text-[13px] font-medium text-white shadow-[0_6px_16px_rgba(108,59,244,0.28)] transition-colors hover:bg-[#5f31e0]"
        >
          Top Performance
        </button>
      </div>

      <div className="mt-auto pt-5">
        <button
          type="button"
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
        </button>
      </div>
    </section>
  );
}
