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
| Search suggestions (API) | `GET /search` | `/api/search` (UI not wired yet) |
| General market news (API) | `GET /news?category=general` | `/api/news` without `symbol` (dashboard card not wired yet) |

The browser never calls Finnhub directly. All five routes proxy the provider with the key held in
`process.env.FINNHUB_API_KEY`.

## ✅ Real user data (entered by you, not seeded)

| Data | Storage | Notes |
|------|---------|-------|
| Watchlist tickers | This browser (`localStorage`, key `marketcap.watchlist`) | Moves to Supabase with auth |
| Positions: ticker, quantity, **total** cost basis, purchase date, target price | This browser (`localStorage`, key `marketcap.portfolio`) | No demo positions are seeded |
| Portfolio value, gain/loss and gain/loss % | Computed: live price × quantity vs. your cost basis | Recomputed on every 60-second poll |
| Target-hit badge | Computed: live price ≥ your target price | Only appears for your own positions |

## ✅ Derived from real observations

| Data | How it is produced | Limitation |
|------|--------------------|------------|
| Dashboard "Statistics" chart | The app records the live portfolio total once per minute into `localStorage` (`marketcap.value-history`) and plots those observations | Starts empty; fills in only while the dashboard is open. No invented curve is drawn. |

## ⚠️ Not available on the Finnhub free plan (deliberately not faked)

| Data | Why | What the UI does |
|------|-----|------------------|
| Intraday price candles (`/stock/candle`) | Finnhub returns **403 / plan-restricted** for free keys — confirmed by `/api/candles` returning `{ "available": false, "reason": "plan" }` | Stock page shows "Finnhub's candle endpoint is not included in the free plan, so no chart is drawn rather than showing invented prices" |
| Top movers / screener | No screener endpoint on the free plan | Feature not built yet (tracked in `Plan.md` stage 8) |
| Trading volume | Not exposed by `/quote` on this plan | Removed from the holdings table; the column now shows **Quantity** from your own position |
| Extended fundamentals (revenue, EPS history, etc.) | Paid metrics | Not shown at all |

## 📚 Static reference data (not market data)

| Data | Where | Why it is acceptable |
|------|-------|----------------------|
| A short ticker → name catalogue (AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, SPOT, NFLX, JPM) | `lib/market-data.ts` | Powers the datalist suggestions in the watchlist/portfolio forms and the dashboard's fixed market-watch tickers. Names are only a label; the price beside them is live. |
| Brand logos for AAPL, GOOGL, SPOT, TWTR | `components/icons.tsx` | Inline SVG brand marks. Other tickers fall back to a two-letter badge. |
| Default watchlist of three tickers (`AAPL`, `MSFT`, `NVDA`) | `lib/stores.ts` | An initial selection only — no prices or positions are invented. |

## 🗑️ Mock data that was removed

Earlier builds shipped invented market data. These were deleted and replaced with live values:

- `holdings`, `portfolioSummary`, `stockRows`, `chartSeries` / `chartDays` (fake prices, portfolio
  totals and chart curve) — removed from `lib/dashboard-data.ts`, which now only formats currency
  and percentages.
- `priceHistory()`, `newsFor()`, `marketNews()` (synthetic price series and article copy) — removed
  from `lib/market-data.ts`.
- Seeded positions (AAPL/GOOGL/SPOT with invented quantities and cost bases) — `seedPositions` is
  now empty; the portfolio starts with no rows.
- The stock page's fake "About" paragraph and invented P/E, market cap and 52-week range — replaced
  by `/api/profile` values, or "—" when Finnhub has none.

## How to confirm it yourself

```bash
npm run dev -- -p 4310

curl "localhost:4310/api/quotes?tickers=AAPL,MSFT"    # live price + change
curl "localhost:4310/api/profile?symbol=AAPL"         # live profile + metrics
curl "localhost:4310/api/news?symbol=AAPL"            # live headlines
curl "localhost:4310/api/candles?symbol=AAPL"         # {"available":false,"reason":"plan"}
```

If `FINNHUB_API_KEY` is missing, every route returns `source: "unconfigured"`, quotes come back
empty and the UI shows "—" / "Waiting for a quote…" — it never falls back to invented prices.
