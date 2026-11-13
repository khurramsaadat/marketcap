"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Browser-local list store. Stands in for Supabase rows while auth is
 * not connected, so the portfolio and watchlist stay usable in the meantime.
 */
const memory = new Map<string, unknown>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function read<T>(key: string, seed: T[]): T[] {
  if (memory.has(key)) return memory.get(key) as T[];
  let value = seed;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) value = JSON.parse(raw) as T[];
    } catch {
      // keep seeded values when storage is malformed or unavailable
    }
  }
  memory.set(key, value);
  return value;
}

function write<T>(key: string, value: T[]) {
  memory.set(key, value);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // storage full or blocked — state still lives in memory
  }
  listeners.forEach((listener) => listener());
}

export function useLocalStore<T>(key: string, seed: T[]) {
  const items = useSyncExternalStore(
    subscribe,
    () => read(key, seed),
    () => seed,
  );

  const setItems = useCallback(
    (update: T[] | ((current: T[]) => T[])) => {
      const current = read(key, seed);
      write(
        key,
        typeof update === "function"
          ? (update as (value: T[]) => T[])(current)
          : update,
      );
    },
    [key, seed],
  );

  return [items, setItems] as const;
}
