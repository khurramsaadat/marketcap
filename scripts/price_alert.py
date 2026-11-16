#!/usr/bin/env python3
"""Bitcoin price alert — CoinGecko free API, checked every 15 minutes.

Usage:
    python scripts/price_alert.py                      # check every 15 min, log every tick
    python scripts/price_alert.py --once               # single check, then exit
    python scripts/price_alert.py --above 100000       # alert when BTC goes above $100,000
    python scripts/price_alert.py --below 90000        # alert when BTC drops below $90,000
    python scripts/price_alert.py --interval 60        # custom interval in seconds

Budget: 96 checks/day at 15 minutes = ~2,880 calls/month, comfortably inside CoinGecko's
free Demo plan cap of 10,000 calls/month (~5 calls/minute). No API key needed.
Standard library only — nothing to pip install.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

URL = (
    "https://api.coingecko.com/api/v3/simple/price"
    "?ids=bitcoin&vs_currencies=usd&include_last_updated_at=true"
)
USER_AGENT = "marketcap-price-alert/1.0"
DEFAULT_INTERVAL = 15 * 60  # 900 s — the free-tier friendly cadence
DEFAULT_LOG = Path(__file__).with_name("price_alert_log.csv")


def fetch_price(timeout: float = 15.0) -> tuple[float, int | None]:
    """Return (usd_price, last_updated_unix) for Bitcoin. Raises on failure."""
    request = urllib.request.Request(URL, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        payload = json.load(response)

    bitcoin = payload.get("bitcoin") or {}
    price = bitcoin.get("usd")
    if price is None:
        raise ValueError(f"unexpected payload: {payload!r}")
    return float(price), bitcoin.get("last_updated_at")


def fetch_with_retry(attempts: int = 3, base_delay: float = 5.0) -> tuple[float, int | None]:
    """Retry transient failures; honour Retry-After when CoinGecko rate-limits us."""
    for attempt in range(1, attempts + 1):
        try:
            return fetch_price()
        except urllib.error.HTTPError as error:
            if error.code == 429:
                wait = _retry_after(error) or base_delay * attempt
                print(f"Rate limited by CoinGecko, waiting {wait:.0f}s…", flush=True)
                time.sleep(wait)
                continue
            if error.code < 500 or attempt == attempts:
                raise
        except (urllib.error.URLError, TimeoutError, ValueError) as error:
            if attempt == attempts:
                raise
            print(f"Attempt {attempt} failed ({error}), retrying…", flush=True)
        time.sleep(base_delay * attempt)

    raise RuntimeError("unreachable")


def _retry_after(error: urllib.error.HTTPError) -> float | None:
    raw = error.headers.get("Retry-After") if error.headers else None
    try:
        return float(raw) if raw is not None else None
    except ValueError:
        return None


def evaluate(price: float, above: float | None, below: float | None) -> str | None:
    """Return an alert message when a threshold is crossed, otherwise None."""
    if above is not None and price >= above:
        return f"ALERT  BTC ${price:,.2f} is at or above your ${above:,.2f} target"
    if below is not None and price <= below:
        return f"ALERT  BTC ${price:,.2f} is at or below your ${below:,.2f} target"
    return None


def append_log(path: Path, price: float, alert: str | None) -> None:
    is_new = not path.exists()
    with path.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        if is_new:
            writer.writerow(["checked_at", "btc_usd", "alert"])
        writer.writerow([datetime.now().isoformat(timespec="seconds"), f"{price:.2f}", alert or ""])


def check_once(above: float | None, below: float | None, log: Path | None) -> None:
    price, updated = fetch_with_retry()
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    source_time = (
        datetime.fromtimestamp(updated).strftime("%H:%M:%S") if updated else "unknown"
    )
    alert = evaluate(price, above, below)

    print(f"[{stamp}] BTC/USD ${price:,.2f}  (CoinGecko update {source_time})", flush=True)
    if alert:
        print(alert, flush=True)

    if log is not None:
        append_log(log, price, alert)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Poll the Bitcoin price and alert on a threshold.")
    parser.add_argument("--interval", type=int, default=DEFAULT_INTERVAL,
                        help="seconds between checks (default 900 = 15 minutes)")
    parser.add_argument("--above", type=float, help="alert when the price reaches this many USD")
    parser.add_argument("--below", type=float, help="alert when the price drops to this many USD")
    parser.add_argument("--once", action="store_true", help="check once and exit")
    parser.add_argument("--log", type=Path, default=DEFAULT_LOG,
                        help=f"CSV log path (default {DEFAULT_LOG.name}); pass '' to disable")
    args = parser.parse_args(argv)

    # argparse turns `--log ""` into Path("."), so treat an empty or current-dir value as "no log"
    log = None if str(args.log) in {"", "."} else args.log
    if args.interval < 60:
        parser.error("--interval must be at least 60 seconds to respect the rate limit")

    if args.once:
        check_once(args.above, args.below, log)
        return 0

    print(
        f"Watching BTC/USD every {args.interval // 60} min"
        f" ({86400 // args.interval} checks/day, ~{30 * 86400 // args.interval:,} calls/month)."
        " Ctrl+C to stop.",
        flush=True,
    )
    failures = 0
    while True:
        try:
            check_once(args.above, args.below, log)
            failures = 0
        except KeyboardInterrupt:
            print("\nStopped.", flush=True)
            return 0
        except Exception as error:  # keep the watcher alive across transient outages
            failures += 1
            print(f"Check failed ({error}); {failures} in a row.", file=sys.stderr, flush=True)

        try:
            time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nStopped.", flush=True)
            return 0


if __name__ == "__main__":
    raise SystemExit(main())
