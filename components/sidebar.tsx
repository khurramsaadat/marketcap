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
import { ThemeToggle } from "@/components/theme-toggle";

const primaryNav = [
  { label: "Overview", href: "/", icon: HomeIcon },
  { label: "My Stock", href: "/watchlist", icon: GridIcon },
  { label: "Portfolio", href: "/portfolio", icon: PortfolioIcon },
  { label: "Analytic", href: null, icon: AnalyticIcon },
  { label: "Community", href: null, icon: GlobeIcon },
  { label: "Account", href: null, icon: AccountIcon },
];

const fileNav = ["Communication", "Affiliates", "Marketing"];

const itemClass = (active: boolean) =>
  `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors ${
    active
      ? "bg-surface-muted font-medium text-ink"
      : "text-ink-soft hover:bg-surface-muted"
  }`;

function SoonBadge() {
  return (
    <span className="ml-auto rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-faint">
      Soon
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-line bg-surface px-5 py-7 lg:flex">
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
              <span
                key={label}
                aria-disabled="true"
                title="Not available yet"
                className="flex w-full cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-faint"
              >
                <Icon className="size-[18px]" />
                {label}
                <SoonBadge />
              </span>
            );
          }

          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={itemClass(active)}
            >
              <Icon className={`size-[18px] ${active ? "text-ink" : "text-faint"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-7 mb-2 flex items-center justify-between px-3">
        <span className="text-[14px] font-medium text-ink">Files</span>
        <span
          aria-disabled="true"
          title="Not available yet"
          className="flex size-6 items-center justify-center rounded-full text-faint"
        >
          <PlusIcon />
        </span>
      </div>

      <nav className="space-y-1">
        {fileNav.map((label) => (
          <span
            key={label}
            aria-disabled="true"
            title="Not available yet"
            className="flex w-full cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-faint"
          >
            <FolderIcon className="size-[18px]" />
            {label}
            <SoonBadge />
          </span>
        ))}
      </nav>

      <div className="mt-auto px-1 pt-6">
        <ThemeToggle />
      </div>
    </aside>
  );
}
