"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
import { applyTheme, toggleTheme, useTheme } from "@/lib/theme";

export function ThemeToggle({
  variant = "segmented",
}: {
  variant?: "segmented" | "icon";
}) {
  const theme = useTheme();
  const isDark = theme === "dark";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:bg-surface-muted"
      >
        {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="flex items-center gap-1 rounded-full bg-surface-muted p-1"
    >
      <button
        type="button"
        onClick={() => applyTheme("light")}
        aria-pressed={!isDark}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
          isDark ? "text-muted hover:text-ink-soft" : "bg-surface text-ink shadow-sm"
        }`}
      >
        <SunIcon className="size-3.5" />
        Light
      </button>
      <button
        type="button"
        onClick={() => applyTheme("dark")}
        aria-pressed={isDark}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
          isDark ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink-soft"
        }`}
      >
        <MoonIcon className="size-3.5" />
        Dark
      </button>
    </div>
  );
}
