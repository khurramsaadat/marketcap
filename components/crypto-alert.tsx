"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ChangeArrow } from "@/components/icons";
import { formatCurrency, formatPercent } from "@/lib/dashboard-data";

type Coin = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change24hPct: number;
  lastUpdated: number;
};

type CryptoResponse = { coin?: Coin | null; fetchedAt?: number; error?: string };

/** Client refresh cadence. CoinGecko itself is hit at most once per 10 minutes. */
const POLL_MS = 5 * 60_000;

const STORAGE_KEY = "marketcap.crypto.alerts.v1";

type Alerts = { above: number | null; below: number | null };

const EMPTY_ALERTS: Alerts = { above: null, below: null };

/**
 * Small external store so the saved targets survive reloads without setting
 * state inside an effect (and without a hydration mismatch).
 */
const listeners = new Set<() => void>();
let snapshot: Alerts | null = null;

function readAlerts(): Alerts {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ALERTS;
    const parsed = JSON.parse(raw) as Partial<Alerts>;
    return {
      above: typeof parsed.above === "number" ? parsed.above : null,
      below: typeof parsed.below === "number" ? parsed.below : null,
    };
  } catch {
    return EMPTY_ALERTS;
  }
}

function getAlerts() {
  if (snapshot === null) snapshot = readAlerts();
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function writeAlerts(next: Alerts) {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage blocked — the alert still works for this session
  }
  listeners.forEach((listener) => listener());
}

function toPrice(value: FormDataEntryValue | null) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function BitcoinMark() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f7931a]/15 text-[#f7931a]">
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1.9 8.6c1.1.3 1.9.9 2.1 2 .2 1.2-.3 2-1.2 2.5.9.4 1.4 1 1.4 2 0 1.6-1.2 2.4-3 2.6v1.9h-1.4v-1.8h-1v1.8H9.4v-1.9c-1.3-.1-2.3-.5-3-1l.8-1.6c.7.5 1.5.8 2.4.8.9 0 1.4-.4 1.4-1.1V9.6C10 9.6 9.4 9.2 9.4 8.5c0-.6.4-1 1.4-1.1h3.1Zm-.9 3.1v2.6c1 0 1.9-.3 1.9-1.3s-.9-1.3-1.9-1.3Zm0 4.2v2.7c1.1 0 2-.3 2-1.4 0-1-1-1.3-2-1.3Z" />
      </svg>
    </span>
  );
}

export function CryptoAlert() {
  const alerts = useSyncExternalStore(subscribe, getAlerts, () => EMPTY_ALERTS);
  const [coin, setCoin] = useState<Coin | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let busy = false;

    const load = async () => {
      if (busy) return;
      busy = true;
      try {
        const response = await fetch("/api/crypto?id=bitcoin", { cache: "no-store" });
        const data = (await response.json().catch(() => null)) as CryptoResponse | null;
        if (!active) return;
        if (data?.coin) {
          setCoin(data.coin);
          setFetchedAt(data.fetchedAt ?? Date.now());
          setFailed(false);
        } else {
          setFailed(true);
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        busy = false;
      }
    };

    void load();
    const timer = window.setInterval(load, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const status = useMemo(() => {
    if (!coin) return null;
    if (alerts.above !== null && coin.price >= alerts.above) {
      return {
        up: true,
        title: "Alert: above your target",
        detail: `BTC is ${formatCurrency(coin.price - alerts.above)} above your ${formatCurrency(alerts.above)} target.`,
      };
    }
    if (alerts.below !== null && coin.price <= alerts.below) {
      return {
        up: false,
        title: "Alert: below your target",
        detail: `BTC is ${formatCurrency(alerts.below - coin.price)} below your ${formatCurrency(alerts.below)} target.`,
      };
    }
    return null;
  }, [alerts, coin]);

  const armed = alerts.above !== null || alerts.below !== null;
  const up = (coin?.change24hPct ?? 0) >= 0;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <BitcoinMark />
          <div>
            <p className="text-[15px] font-semibold leading-tight text-ink">
              Bitcoin <span className="text-muted">BTC</span>
            </p>
            <p className="text-[11.5px] text-faint">CoinGecko · refreshes every 5 min</p>
          </div>
        </div>

        {coin ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[22px] font-semibold leading-none tracking-tight text-ink tabular-nums">
              {formatCurrency(coin.price)}
            </p>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11.5px] font-medium ${
                up ? "bg-up-soft text-up" : "bg-down-soft text-down"
              }`}
            >
              <ChangeArrow up={up} className="size-3" />
              {formatPercent(coin.change24hPct)} 24h
            </span>
          </div>
        ) : (
          <p className="text-[12px] text-faint">
            {failed ? "Price unavailable right now — retrying automatically." : "Loading price…"}
          </p>
        )}
      </div>

      {status ? (
        <div
          role="alert"
          className={`mt-4 rounded-xl border px-3.5 py-3 text-[12.5px] ${
            status.up
              ? "border-up/30 bg-up-soft text-up"
              : "border-down/30 bg-down-soft text-down"
          }`}
        >
          <p className="font-semibold">{status.title}</p>
          <p className="mt-0.5 opacity-90">{status.detail}</p>
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          writeAlerts({
            above: toPrice(data.get("above")),
            below: toPrice(data.get("below")),
          });
        }}
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-wide text-faint">
          Alert above
          <input
            key={`above-${alerts.above}`}
            name="above"
            inputMode="decimal"
            defaultValue={alerts.above ?? ""}
            placeholder="70000"
            className="h-9 w-[130px] rounded-lg border border-line bg-surface-muted px-3 text-[13px] font-normal normal-case tracking-normal text-ink tabular-nums outline-none placeholder:text-faint focus:border-accent/50"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-wide text-faint">
          Alert below
          <input
            key={`below-${alerts.below}`}
            name="below"
            inputMode="decimal"
            defaultValue={alerts.below ?? ""}
            placeholder="50000"
            className="h-9 w-[130px] rounded-lg border border-line bg-surface-muted px-3 text-[13px] font-normal normal-case tracking-normal text-ink tabular-nums outline-none placeholder:text-faint focus:border-accent/50"
          />
        </label>
        <button
          type="submit"
          className="h-9 rounded-full bg-accent px-4 text-[12.5px] font-medium text-on-accent transition-colors hover:bg-accent-strong"
        >
          {armed ? "Update alerts" : "Set alerts"}
        </button>
        {armed ? (
          <button
            type="button"
            onClick={() => writeAlerts(EMPTY_ALERTS)}
            className="h-9 rounded-full border border-line px-4 text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-surface-muted"
          >
            Clear
          </button>
        ) : null}
      </form>

      <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted">
        {armed
          ? [
              alerts.above !== null ? `watching for BTC ≥ ${formatCurrency(alerts.above)}` : null,
              alerts.below !== null ? `watching for BTC ≤ ${formatCurrency(alerts.below)}` : null,
            ]
              .filter(Boolean)
              .join(" · ") + " — checked on every refresh."
          : "Set a target and this card flags it the moment the price crosses, while you are on the page."}
        {fetchedAt ? ` Last checked ${new Date(fetchedAt).toLocaleTimeString("en-US")}.` : ""}
      </p>
    </section>
  );
}
