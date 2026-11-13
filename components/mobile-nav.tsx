"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/watchlist", label: "My Stock" },
  { href: "/portfolio", label: "Portfolio" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden"
    >
      {links.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
              active
                ? "border-transparent bg-surface-muted text-ink"
                : "border-line bg-surface text-ink-soft hover:bg-surface-muted"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
