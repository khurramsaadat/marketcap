import { LineChart } from "@/components/line-chart";
import type { ValueSnapshot } from "@/lib/use-value-history";

function compact(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

export function StatisticsChart({ series }: { series: ValueSnapshot[] }) {
  const values = series.map((point) => point.v);
  const hasData = values.length >= 2;

  const low = hasData ? Math.min(...values) * 0.995 : 0;
  const high = hasData ? Math.max(...values) * 1.005 : 1;
  const ticks = Array.from({ length: 4 }, (_, i) => low + ((high - low) / 3) * i);
  const labels = series.map((point) =>
    new Date(point.t).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  const labelEvery = Math.max(1, Math.ceil(series.length / 6));

  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[16px] font-semibold text-ink">Statistics</h2>
        <span className="rounded-full bg-[#f8f9fa] px-2.5 py-1 text-[11px] font-medium text-muted">
          Recorded live
        </span>
      </div>

      {hasData ? (
        <div className="mt-4">
          <LineChart
            id="portfolio-statistics"
            values={values}
            labels={labels}
            labelEvery={labelEvery}
            min={low}
            max={high}
            ticks={ticks}
            tickFormat={compact}
            stroke="#f7a2b6"
            fillTop="#f7a8bb"
            marker={{ index: values.length - 1, label: compact(values[values.length - 1]) }}
          />
          <p className="mt-2 text-[11.5px] text-faint">
            Charted from this browser&apos;s own observations, recorded once per
            minute while the dashboard is open.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 text-center">
          <p className="text-[13.5px] font-medium text-ink">
            Not enough live observations yet
          </p>
          <p className="mt-1 max-w-[320px] text-[12px] leading-relaxed text-muted">
            Portfolio values are recorded once a minute. Keep this page open and the
            chart will start with your real values — no sample curve is drawn.
          </p>
        </div>
      )}
    </section>
  );
}
