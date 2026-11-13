import { AppShell } from "@/components/app-shell";
import { LiveHoldings } from "@/components/live-holdings";
import { PortfolioValues } from "@/components/portfolio-values";
import { StatisticsChart } from "@/components/statistics-chart";
import { StockTable } from "@/components/stock-table";
import { holdings } from "@/lib/dashboard-data";

export default function DashboardPage() {
  return (
    <AppShell>
      <LiveHoldings holdings={holdings} />

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <PortfolioValues />
        <StatisticsChart />
      </div>

      <div className="mt-5">
        <StockTable />
      </div>
    </AppShell>
  );
}
