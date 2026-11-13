"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AccountIcon,
  AnalyticIcon,
  FolderIcon,
  GlobeIcon,
  GridIcon,
  HomeIcon,
  LogoMark,
  PlusIcon,
  PortfolioIcon,
} from "@/components/icons";

const primaryNav = [
  { label: "Overview", href: "/", icon: HomeIcon },
  { label: "My Stock", href: "/watchlist", icon: GridIcon },
  { label: "Portfolio", href: "/portfolio", icon: PortfolioIcon },
  { label: "Analytic", href: null, icon: AnalyticIcon },
  { label: "Community", href: null, icon: GlobeIcon },
  { label: "Account", href: null, icon: AccountIcon },
];

const fileNav = [
  { label: "Communication", icon: FolderIcon },
  { label: "Affiliates", icon: FolderIcon },
  { label: "Marketing", icon: FolderIcon },
];

const itemClass = (active: boolean) =>
  `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors ${
    active
      ? "bg-[#f2f3f5] font-medium text-ink"
      : "text-ink-soft hover:bg-[#f8f9fa]"
  }`;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-line bg-white px-5 py-7 lg:flex">
      <Link href="/" className="flex items-center gap-2.5 px-2">
        <LogoMark />
        <span className="text-[19px] font-semibold tracking-tight text-ink">
          MarketCap
        </span>
      </Link>

      <nav className="mt-9 space-y-1">
        {primaryNav.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : href !== null && pathname.startsWith(href);

          if (!href) {
            return (
              <button key={label} type="button" className={itemClass(false)}>
                <Icon className="size-[18px] text-faint" />
                {label}
              </button>
            );
          }

          return (
            <Link key={label} href={href} className={itemClass(active)}>
              <Icon className={`size-[18px] ${active ? "text-ink" : "text-faint"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-7 mb-2 flex items-center justify-between px-3">
        <span className="text-[14px] font-medium text-ink">Files</span>
        <button
          type="button"
          aria-label="Add file"
          className="flex size-6 items-center justify-center rounded-full text-faint transition-colors hover:bg-[#f2f3f5] hover:text-ink-soft"
        >
          <PlusIcon />
        </button>
      </div>

      <nav className="space-y-1">
        {fileNav.map(({ label, icon: Icon }) => (
          <button key={label} type="button" className={itemClass(false)}>
            <Icon className="size-[18px] text-faint" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
