import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";

function MobileHeader() {
  return (
    <header className="mb-4 flex items-center justify-between lg:hidden">
      <Link href="/" className="flex items-center gap-2.5">
        <LogoMark className="size-8" />
        <span className="text-[17px] font-semibold tracking-tight text-ink">
          MarketCap
        </span>
      </Link>
      <div className="flex size-9 items-center justify-center rounded-full bg-[#ece8fd] text-[13px] font-semibold text-accent">
        MC
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
        <MobileHeader />
        <MobileNav />
        {children}
      </main>
    </div>
  );
}
