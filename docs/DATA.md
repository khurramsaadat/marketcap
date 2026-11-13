# Data provenance — what is live, what is not

MarketCap is built so that **every market figure on screen comes from Finnhub**. Where a figure
cannot be obtained on the free plan, the UI says so instead of drawing invented numbers.

Last reviewed: 2026-11-13 · Provider: Finnhub (free tier) · Key: `FINNHUB_API_KEY` (server-side only)

## ✅ Live data (Finnhub, fetched at request time)

| Data | Finnhub endpoint | Shown on |
|------|------------------|----------|
| Current price | `GET /quote` (`c`) | Dashboard cards, watchlist, portfolio, stock page |
| Price change and % change | `GET /quote` (`d`, `dp`) | Same as above |
| Day high / day low | `GET /quote` (`h`, `l`) | Stock page "Day range" |
| Previous close | `GET /quote` (`pc`) | Stock page "Previous close" |
| Company name, exchange, industry, country, currency, IPO date, website | `GET /stock/profile2` | Stock page header and Company panel |
| Market capitalisation | `GET /stock/profile2` + `/stock/metric` | Stock page "Market cap" |
| P/E ratio, 52-week high/low, beta, dividend yield | `GET /stock/metric?metric=all` | Stock page stats grid |
| Per-stock headlines | `GET /company-news` | Stock page News panel (links open the publisher) |
| Symbol search | `GET /search` | Portfolio search box (debounced), and directly via `/api/search` |
| General market news (API) | `GET /news?category=general` | `/api/news` without `symbol` (dashboard card not wired yet) |
| Intraday OHLC candles | **Yahoo Finance** chart endpoint (no key), not Finnhub | Stock page price history: 1D = 5m bars, 5D = 15m, 1M = 60m |

The browser never calls Finnhub directly. All five routes proxy the provider with the key held in
`process.env.FINNHUB_API_KEY`.

## ⏱️ Refresh cadence and caching

| Layer | Behaviour |
|-------|-----------|
| Browser | Every mounted price polls `/api/quotes` every **30 seconds**, and immediately when a background tab becomes visible again. The UI shows "Updated Xs ago" next to the prices. |
| `/api/quotes` | Each ticker is cached in memory for **20 seconds**; concurrent requests for the same symbol share one upstream call. If Finnhub fails (429 or network), the last known price is served for up to **5 minutes** rather than dropping the row. |
| Why it matters | Finnhub's free plan allows 60 calls/minute for the whole key and charges one call per ticker, so the cache is what makes 30-second polling safe with several tabs or visitors. |

## ✅ Real user data (entered by you, not seeded)

| Data | Storage | Notes |
|------|---------|-------|
| Watchlist tickers | This browser (`localStorage`, key `marketcap.watchlist`) | Moves to Supabase with auth |
| Positions: ticker, quantity, **total** cost basis, purchase date, target price | This browser (`localStorage`, key `marketcap.portfolio`) | Four example positions (AAPL, MSFT, NVDA, AMZN; 1 share each) are seeded on first run. Their cost basis is the reference price recorded on 2026-11-13 — gain/loss afterwards is real movement, not mock data |
| Portfolio value, gain/loss and gain/loss % | Computed: live price × quantity vs. your cost basis | Recomputed on every 30-second poll |
| Target-hit badge | Computed: live price ≥ your target price | Only appears for your own positions |

## ✅ Derived from real observations

| Data | How it is produced | Limitation |
|------|--------------------|------------|
| Dashboard "Statistics" chart | The app records the live portfolio total once per minute into `localStorage` (`marketcap.value-history`) and plots those observations | Starts empty; fills in only while the dashboard is open. No invented curve is drawn. |

## ⚠️ Not available on the Finnhub free plan (deliberately not faked)

| Data | Why | What the UI does |
|------|-----|------------------|
| ~~Intraday price candles from Finnhub~~ | Finnhub returns **403 / plan-restricted** for free keys | Replaced: `/api/candles` now reads Yahoo Finance's public chart endpoint, so the stock page draws a real 1D/5D/1M candlestick chart instead of a notice |
| Top movers / screener | No screener endpoint on the free plan; a symbol list is available via `GET /stock/symbol?exchange=US` (one call, ~31k rows) | Not built yet — see `Plan.md` stage 8 and the notes in `HANDOVER.md` |
| Trading volume | Not exposed by `/quote` on this plan | Removed from the holdings table; the column now shows **Quantity** from your own position |
| Extended fundamentals (revenue, EPS history, etc.) | Paid metrics | Not shown at all |

## 📚 Static reference data (not market data)

| Data | Where | Why it is acceptable |
|------|-------|----------------------|
| A short ticker → name catalogue (AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, SPOT, NFLX, JPM) | `lib/market-data.ts` | Powers the datalist suggestions in the watchlist/portfolio forms and the dashboard's fixed market-watch tickers. Names are only a label; the price beside them is live. |
| Brand logos for AAPL, GOOGL, SPOT, TWTR | `components/icons.tsx` | Inline SVG brand marks. Other tickers fall back to a two-letter badge. |
| Default watchlist of four tickers (`AAPL`, `MSFT`, `NVDA`, `AMZN`) | `lib/stores.ts` | An initial selection only — no prices are invented; every quote is live. |

## 🗑️ Mock data that was removed

Earlier builds shipped invented market data. These were deleted and replaced with live values:

- `holdings`, `portfolioSummary`, `stockRows`, `chartSeries` / `chartDays` (fake prices, portfolio
  totals and chart curve) — removed from `lib/dashboard-data.ts`, which now only formats currency
  and percentages.
- `priceHistory()`, `newsFor()`, `marketNews()` (synthetic price series and article copy) — removed
  from `lib/market-data.ts`.
- Invented seeded positions (AAPL/GOOGL/SPOT with made-up quantities and prices) — replaced by four
  clearly-labelled example positions in `lib/stores.ts` whose cost basis is a dated reference price.
- The stock page's fake "About" paragraph and invented P/E, market cap and 52-week range — replaced
  by `/api/profile` values, or "—" when Finnhub has none.

## How to confirm it yourself

```bash
npm run dev -- -p 4310

curl "localhost:4310/api/quotes?tickers=AAPL,MSFT"    # live price + change
curl "localhost:4310/api/profile?symbol=AAPL"         # live profile + metrics
curl "localhost:4310/api/news?symbol=AAPL"            # live headlines
curl "localhost:4310/api/candles?symbol=AAPL&range=1d"  # live 5m OHLC bars (Yahoo)
```

If `FINNHUB_API_KEY` is missing, every route returns `source: "unconfigured"`, quotes come back
empty and the UI shows "—" / "Waiting for a quote…" — it never falls back to invented prices.
