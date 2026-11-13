"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "marketcap.theme";
const listeners = new Set<() => void>();
let cached: Theme | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The inline script in the root layout applies the class before paint. */
export function readTheme(): Theme {
  if (cached) return cached;
  if (typeof document === "undefined") return "light";
  cached = document.documentElement.classList.contains("dark") ? "dark" : "light";
  return cached;
}

export function applyTheme(theme: Theme) {
  cached = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage blocked — the class still applies for this session
  }
  listeners.forEach((listener) => listener());
}

export function toggleTheme() {
  applyTheme(readTheme() === "dark" ? "light" : "dark");
}

export function useTheme(): Theme {
  // Dark is the default, so the server snapshot matches an unstyled first visit.
  return useSyncExternalStore(subscribe, readTheme, () => "dark");
}
