import { LineChart } from "@/components/line-chart";
import { chartDays, chartSeries } from "@/lib/dashboard-data";

const ticks = [0, 20000, 40000, 60000, 80000];

export function StatisticsChart() {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <h2 className="text-[16px] font-semibold text-ink">Statistics</h2>
      <div className="mt-4">
        <LineChart
          id="portfolio-statistics"
          values={chartSeries}
          labels={chartDays}
          labelEvery={2}
          min={0}
          max={80000}
          ticks={ticks}
          tickFormat={(value) => (value === 0 ? "0" : `${value / 1000}k`)}
          stroke="#f7a2b6"
          fillTop="#f7a8bb"
          marker={{ index: 11, label: "25.5k" }}
        />
      </div>
    </section>
  );
}
