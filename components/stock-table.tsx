import Link from "next/link";
import { ChangeArrow, SortIcon, StockLogo } from "@/components/icons";
import { formatCurrency, formatPercent } from "@/lib/dashboard-data";

export type StockRowData = {
  id: string;
  ticker: string;
  name: string;
  investDate: string;
  quantity: number;
  changePct?: number;
  price?: number;
};

const columns = [
  { label: "Name Stock", align: "left" },
  { label: "Invest Date", align: "left" },
  { label: "Quantity", align: "left" },
  { label: "Change", align: "left" },
  { label: "Price/stock", align: "right" },
] as const;

const gridCols =
  "grid-cols-[minmax(190px,1.5fr)_minmax(120px,0.9fr)_minmax(90px,0.6fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)]";

function Row({ row }: { row: StockRowData }) {
  const hasChange = typeof row.changePct === "number";
  const up = (row.changePct ?? 0) >= 0;

  return (
    <div className={`grid ${gridCols} items-center gap-3 border-t border-line px-1 py-3.5`}>
      <Link href={`/stocks/${row.ticker}`} className="flex min-w-0 items-center gap-3">
        <StockLogo ticker={row.ticker} size="size-9" />
        <span className="min-w-0">
          <span className="block text-[14px] font-semibold leading-tight text-ink">
            {row.ticker}
          </span>
          <span className="block truncate text-[12px] text-muted">{row.name}</span>
        </span>
      </Link>
      <p className="text-[13.5px] text-ink-soft">{row.investDate}</p>
      <p className="text-[13.5px] text-ink-soft tabular-nums">{row.quantity}</p>
      <div>
        {hasChange ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ${
              up ? "bg-up-soft text-up" : "bg-down-soft text-down"
            }`}
          >
            <ChangeArrow up={up} className="size-3" />
            {formatPercent(row.changePct as number)}
          </span>
        ) : (
          <span className="text-[12px] text-faint">No quote</span>
        )}
      </div>
      <p className="text-right text-[13.5px] font-semibold text-ink tabular-nums">
        {typeof row.price === "number" ? formatCurrency(row.price) : "—"}
      </p>
    </div>
  );
}

export function StockTable({ rows }: { rows: StockRowData[] }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <h2 className="text-[16px] font-semibold text-ink">My Stock</h2>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-line px-6 py-10 text-center">
          <p className="text-[14px] font-medium text-ink">No positions yet</p>
          <p className="mt-1 text-[13px] text-muted">
            Add a position on the{" "}
            <Link href="/portfolio" className="font-medium text-accent">
              portfolio page
            </Link>{" "}
            to see it here with live pricing.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[680px]">
            <div className={`grid ${gridCols} items-center gap-3 px-1 pb-1`}>
              {columns.map((column) => (
                <span
                  key={column.label}
                  className={`flex items-center gap-1.5 text-[13px] font-medium text-muted ${
                    column.align === "right" ? "justify-end" : "justify-start"
                  }`}
                >
                  {column.label}
                  <SortIcon className="size-3 text-faint" />
                </span>
              ))}
            </div>

            {rows.map((row) => (
              <Row key={row.id} row={row} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
