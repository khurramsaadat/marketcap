import { ChangeArrow, SortIcon, StockLogo } from "@/components/icons";
import {
  formatCurrency,
  formatPercent,
  stockRows,
  type StockRow,
} from "@/lib/dashboard-data";

const columns = [
  { label: "Name Stock", align: "left" },
  { label: "Invest Date", align: "left" },
  { label: "Volume", align: "left" },
  { label: "Change", align: "left" },
  { label: "Price/stock", align: "right" },
] as const;

const gridCols =
  "grid-cols-[minmax(190px,1.5fr)_minmax(120px,0.9fr)_minmax(90px,0.6fr)_minmax(110px,0.7fr)_minmax(110px,0.7fr)]";

function Row({ row }: { row: StockRow }) {
  const up = row.changePct >= 0;

  return (
    <div className={`grid ${gridCols} items-center gap-3 border-t border-line px-1 py-3.5`}>
      <div className="flex items-center gap-3">
        <StockLogo ticker={row.ticker} size="size-9" />
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-tight text-ink">
            {row.ticker}
          </p>
          <p className="truncate text-[12px] text-muted">{row.name}</p>
        </div>
      </div>
      <p className="text-[13.5px] text-ink-soft">{row.investDate}</p>
      <p className="text-[13.5px] text-ink-soft tabular-nums">{row.volume}</p>
      <div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ${
            up ? "bg-up-soft text-up" : "bg-down-soft text-down"
          }`}
        >
          <ChangeArrow up={up} className="size-3" />
          {formatPercent(row.changePct)}
        </span>
      </div>
      <p className="text-right text-[13.5px] font-semibold text-ink tabular-nums">
        {formatCurrency(row.price)}
      </p>
    </div>
  );
}

export function StockTable() {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <h2 className="text-[16px] font-semibold text-ink">My Stock</h2>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[680px]">
          <div className={`grid ${gridCols} items-center gap-3 px-1 pb-1`}>
            {columns.map((column) => (
              <button
                key={column.label}
                type="button"
                className={`flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink-soft ${
                  column.align === "right" ? "justify-end" : "justify-start"
                }`}
              >
                {column.label}
                <SortIcon />
              </button>
            ))}
          </div>

          {stockRows.map((row) => (
            <Row key={row.ticker} row={row} />
          ))}
        </div>
      </div>
    </section>
  );
}
