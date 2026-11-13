import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { StockDetail } from "@/components/stock-detail";
import { quotes } from "@/lib/market-data";

export function generateStaticParams() {
  return quotes.map((quote) => ({ ticker: quote.ticker }));
}

type StockParams = { ticker: string };

async function StockContent({ params }: { params: Promise<StockParams> }) {
  const { ticker } = await params;
  // Keyed so switching symbols resets fetched profile/news instead of briefly
  // showing the previous company's data.
  return <StockDetail key={ticker.toUpperCase()} ticker={ticker} />;
}

function StockFallback() {
  return (
    <div className="space-y-5">
      <div className="h-4 w-24 animate-pulse rounded-full bg-[#eceef2]" />
      <div className="h-[260px] animate-pulse rounded-2xl border border-line bg-white" />
      <div className="h-[220px] animate-pulse rounded-2xl border border-line bg-white" />
    </div>
  );
}

export default function StockPage({ params }: { params: Promise<StockParams> }) {
  return (
    <AppShell>
      <Suspense fallback={<StockFallback />}>
        <StockContent params={params} />
      </Suspense>
    </AppShell>
  );
}
