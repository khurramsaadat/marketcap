"use client";

import { useSyncExternalStore } from "react";

export type ValueSnapshot = { t: number; v: number };

const KEY = "marketcap.value-history";
const EMPTY: ValueSnapshot[] = [];
const MIN_GAP_MS = 55_000;
const MAX_POINTS = 180;

let cache: ValueSnapshot[] | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function load(): ValueSnapshot[] {
  if (cache) return cache;
  cache = EMPTY;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed = raw ? (JSON.parse(raw) as ValueSnapshot[]) : [];
      cache = Array.isArray(parsed) ? parsed : EMPTY;
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

/**
 * Stores a real observation of the portfolio value at most once a minute.
 * The dashboard chart is drawn only from these observations — nothing invented.
 */
export function recordValue(value: number) {
  if (!Number.isFinite(value) || value <= 0) return;

  const series = load();
  const last = series[series.length - 1];
  if (last && Date.now() - last.t < MIN_GAP_MS) return;

  cache = [...series, { t: Date.now(), v: value }].slice(-MAX_POINTS);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // storage unavailable — keep the in-memory series
  }
  listeners.forEach((listener) => listener());
}

export function useValueHistory() {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}
