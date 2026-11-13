import Link from "next/link";
import { ChangeArrow, StockLogo } from "@/components/icons";
import { formatCurrency, formatPercent } from "@/lib/dashboard-data";

export type StockCardData = {
  ticker: string;
  name: string;
  price?: number;
  changePct?: number;
};

export function StockCard({ ticker, name, price, changePct }: StockCardData) {
  const hasChange = typeof changePct === "number";
  const up = (changePct ?? 0) >= 0;

  return (
    <Link
      href={`/stocks/${ticker}`}
      className="block rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-shadow hover:shadow-[0_6px_20px_rgba(16,24,40,0.06)]"
    >
      <div className="flex items-center gap-3">
        <StockLogo ticker={ticker} />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight text-ink">{ticker}</p>
          <p className="truncate text-[12px] text-muted">{name}</p>
        </div>
      </div>

      <p className="mt-5 text-[24px] font-semibold tracking-tight text-ink tabular-nums">
        {typeof price === "number" ? formatCurrency(price) : "—"}
      </p>

      <p className="mt-1 flex items-center gap-1 text-[12px]">
        {hasChange ? (
          <>
            <ChangeArrow
              up={up}
              className={`size-3.5 ${up ? "text-up" : "text-down"}`}
            />
            <span className={`font-medium ${up ? "text-up" : "text-down"}`}>
              {formatPercent(changePct)}
            </span>
            <span className="text-muted">today</span>
          </>
        ) : (
          <span className="text-faint">Waiting for a quote…</span>
        )}
      </p>
    </Link>
  );
}
