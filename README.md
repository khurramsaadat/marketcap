# MarketCap

A stock investment dashboard built with Next.js and Finnhub: live quotes, a watchlist, a portfolio
tracked against cost basis and target prices, and company news.

## Data policy (read this first)

MarketCap does **not** ship invented market data.

- Prices, changes, company profiles, metrics and news are fetched live from Finnhub through
  server-side API routes; the API key never reaches the browser.
- Anything the free plan cannot provide (intraday candles, top movers, volume) is shown as a clear
  notice or omitted — never faked.
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
| `/stocks/[ticker]` | Live quote, company profile/metrics, news; candle chart shows a notice when the plan blocks it |
| `/api/quotes` | Batched Finnhub quotes (`?tickers=AAPL,MSFT`) |
| `/api/profile` | Finnhub profile + key metrics (`?symbol=AAPL`) |
| `/api/news` | Company news (`?symbol=AAPL`) or market news (no symbol) |
| `/api/search` | Finnhub symbol search (`?q=apple`) |
| `/api/candles` | Intraday candles; reports `available: false` when the plan blocks them |

Quotes are polled every 60 seconds on the dashboard, watchlist and portfolio.

## Documentation

- [`PRD.md`](./PRD.md) — requirements and acceptance criteria
- [`Plan.md`](./Plan.md) — stagewise plan and current progress
- [`DATA.md`](./DATA.md) — what is live, derived, static or unavailable
- [`input.md`](./input.md) — the requirements and decisions this build came from
- [`ref.jpg`](./ref.jpg) — the dashboard design reference

## Not done yet

Supabase auth (email/password + Google), per-user rows with RLS, deployment to Freebuff Sites,
top movers, general-news card on the dashboard, and a search UI. Details in `Plan.md`.
