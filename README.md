# MarketCap

A stock investment dashboard built with Next.js and Finnhub: live quotes, a watchlist, a portfolio
tracked against cost basis and target prices, and company news.

## Data policy (read this first)

MarketCap does **not** ship invented market data.

- Prices, changes, company profiles, metrics and news are fetched live from Finnhub through
  server-side API routes; the API key never reaches the browser.
- Intraday candlestick charts (1D / 5D / 1M) come from Yahoo Finance's public chart endpoint, because
  Finnhub's free plan blocks `/stock/candle`. No key or signup is needed; results are cached for 45s.
- Anything the free plan cannot provide (top movers, volume) is shown as a clear notice or omitted —
  never faked.
- Portfolio and watchlist entries are your own input, stored in this browser until Supabase auth
  is connected.

Full per-field breakdown: **[`DATA.md`](./DATA.md)**.

## Stack

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript
- Tailwind CSS v4 (theme tokens in `app/globals.css`)
- Finnhub free tier — quotes, company profile, metrics, company news, search
- Supabase auth + Postgres + RLS — planned, see `Plan.md`

## Getting started

```bash
npm install
cp .env.example .env.local   # or create .env.local yourself
# .env.local → FINNHUB_API_KEY=<your key>
npm run dev -- -p 4310
```

Open http://localhost:4310. Port 3000 is often occupied by other local apps, so the examples use
4310.

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `FINNHUB_API_KEY` | yes | Server-side Finnhub key. Never expose it with a `NEXT_PUBLIC_` prefix. |
| `NEXT_PUBLIC_SUPABASE_URL` | later | Supabase project URL (auth phase) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | later | Supabase anon key (auth phase) |
| `SUPABASE_SERVICE_ROLE_KEY` | later | Server-only key for privileged DB work |

`.env*` is gitignored.

## Scripts

```bash
npm run dev     # dev server (Turbopack)
npm run build   # production build + type check
npm run lint    # eslint
npm start       # serve the production build
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Dashboard: live market watch cards, portfolio value, recorded statistics chart, positions table |
| `/watchlist` | Followed tickers with live prices |
| `/portfolio` | Positions with quantity, cost basis, purchase date, target price, computed gain/loss |
| `/stocks/[ticker]` | Live quote, company profile/metrics, news and an intraday candlestick chart (1D/5D/1M, Yahoo Finance) |
| `/api/quotes` | Batched Finnhub quotes (`?tickers=AAPL,MSFT`) |
| `/api/profile` | Finnhub profile + key metrics (`?symbol=AAPL`) |
| `/api/news` | Company news (`?symbol=AAPL`) or market news (no symbol) |
| `/api/search` | Finnhub symbol search (`?q=apple`) |
| `/api/candles` | Intraday OHLC candles from Yahoo Finance (`1d`/`5d`/`1mo`), cached 45s per symbol and range |

Quotes are polled every 30 seconds on the dashboard, watchlist, portfolio and stock pages.
Each ticker is cached for 20 seconds server-side, so several tabs or visitors polling at once
share a single Finnhub call, and a failed lookup falls back to the last known price for up to
five minutes instead of blanking the row.

## Defaults

- The site opens in **dark mode**; a Light/Dark choice is remembered per browser.
- A first-time visitor starts with four example positions and the same four watchlist tickers:
  **AAPL, MSFT, NVDA, AMZN**, one share each (`lib/stores.ts`). Prices are always live and your own
  rows replace them as soon as you edit.

## Documentation

**Picking the project up?** Start with the handover set:

- [`HANDOVER.md`](./HANDOVER.md) — status, file map, constraints, next steps
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — data flow, API contracts, state, theming
- [`DEVELOPMENT.md`](./DEVELOPMENT.md) — setup, conventions, deploy, troubleshooting

Project background:

- [`PRD.md`](./PRD.md) — requirements and acceptance criteria
- [`Plan.md`](./Plan.md) — stagewise plan and current progress
- [`DATA.md`](./DATA.md) — what is live, derived, static or unavailable
- [`input.md`](./input.md) — the requirements and decisions this build came from
- [`ref.jpg`](./ref.jpg) — the dashboard design reference

## Not done yet

Supabase auth (email/password + Google) with per-user rows and RLS, top movers, the general-news card
on the dashboard, streaming prices, and automated tests. Details in `Plan.md` and `HANDOVER.md`.
