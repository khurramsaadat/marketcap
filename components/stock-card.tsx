import Link from "next/link";
import { ChangeArrow, StockLogo } from "@/components/icons";
import { formatCurrency, formatPercent, type StockHolding } from "@/lib/dashboard-data";

export function StockCard({ holding }: { holding: StockHolding }) {
  const up = holding.changePct >= 0;

  return (
    <Link
      href={`/stocks/${holding.ticker}`}
      className="block rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-shadow hover:shadow-[0_6px_20px_rgba(16,24,40,0.06)]"
    >
      <div className="flex items-center gap-3">
        <StockLogo ticker={holding.ticker} />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight text-ink">
            {holding.ticker}
          </p>
          <p className="truncate text-[12px] text-muted">{holding.name}</p>
        </div>
      </div>

      <p className="mt-5 text-[24px] font-semibold tracking-tight text-ink tabular-nums">
        {formatCurrency(holding.value)}
      </p>

      <p className="mt-1 flex items-center gap-1 text-[12px]">
        <ChangeArrow
          up={up}
          className={`size-3.5 ${up ? "text-up" : "text-down"}`}
        />
        <span className={`font-medium ${up ? "text-up" : "text-down"}`}>
          {formatPercent(holding.changePct)}
        </span>
        <span className="text-muted">vs last month</span>
      </p>
    </Link>
  );
}
