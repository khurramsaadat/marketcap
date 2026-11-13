# MarketCap — developer handover

Everything a new developer needs to pick this project up: what exists, how it is wired, what is
deliberately missing, and where the sharp edges are. Read this first, then
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for the internals and [`DEVELOPMENT.md`](./DEVELOPMENT.md) for
running, testing and deploying.

- **Live site:** https://marketcap-zeroone.netlify.app/ (Netlify, auto-deploy from `main`)
- **Repository:** https://github.com/khurramsaadat/marketcap
- **Product intent:** [`PRD.md`](./PRD.md) · **Roadmap:** [`Plan.md`](./Plan.md) · **Data
  provenance:** [`DATA.md`](./DATA.md)
- **Status:** working personal-use app. Auth, a database and per-user data are **not** built yet.

## 1. What the app does

A Google-Finance-style stock dashboard with four screens:

| Screen | Route | What it does |
|--------|-------|--------------|
| Overview | `/` | Four market cards, portfolio totals, portfolio value chart, "My Stock" table, top/worst sort |
| My Stock (watchlist) | `/watchlist` | Add/remove tickers, live prices, links to each stock page |
| Portfolio | `/portfolio` | Positions (ticker, quantity, cost basis, purchase date, target), totals, target-hit badge, stock search |
| Stock detail | `/stocks/[ticker]` | Live quote, profile/metrics, 1D/5D/1M candlestick chart, news, add to watchlist/portfolio |

All market data is real and comes from two providers:

- **Finnhub** (free tier) — quotes, company profile/metrics, news, symbol search. Key is server-side
  only (`FINNHUB_API_KEY`).
- **Yahoo Finance** public chart endpoint — intraday OHLC candles for the price-history chart,
  because Finnhub's free plan blocks `/stock/candle`. Keyless.

Nothing on screen is invented. Where a provider returns nothing the UI says so rather than drawing
sample numbers; see [`DATA.md`](./DATA.md) for the per-field breakdown.

## 2. Technology

- **Next.js 16.4.6** (App Router, Server Components, `cacheComponents` enabled), **React 19**,
  **TypeScript** (strict).
- **Tailwind CSS v4** with a CSS-variable design-token layer in `app/globals.css` (light + dark).
- No chart library, no component library, no state library: SVG charts and a tiny
  `useSyncExternalStore` store are hand-written.
- Fonts: Geist / Geist Mono via `next/font`.
- Hosting: Netlify (`@netlify/plugin-nextjs` auto-detected). No custom server.

## 3. Current state

| Area | Status |
|------|--------|
| Live quotes, 30s polling, "Updated Xs ago" | Done |
| Server-side quote cache (20s) + stale fallback | Done |
| Portfolio CRUD, gain/loss, target alerts | Done, browser-local |
| Watchlist CRUD | Done, browser-local |
| Stock detail: profile, metrics, news | Done |
| Intraday candlestick chart (1D/5D/1M) | Done, Yahoo-sourced |
| Portfolio stock search with live suggestions | Done |
| Dark mode (default) + light mode | Done |
| Supabase auth, RLS, cross-device data | **Not started** |
| Top movers / screener | **Not started** (no free endpoint) |
| Dashboard market-news card | API exists (`/api/news` without symbol); card not wired |
| Tests (unit/e2e) | **None** — verification is lint + build + manual |

### Seeded defaults

A first-time visitor gets four example positions and the same four watchlist tickers: **AAPL, MSFT,
NVDA, AMZN**, one share each, cost basis fixed at the reference prices recorded on 2026-11-13. They
are seeds, not market data: prices are always live, so gain/loss reflects the real move since that
date. Any visitor with `marketcap.portfolio` already in `localStorage` keeps their own rows — seeds
only apply when the key is absent. Edit `lib/stores.ts` to change them.

The site defaults to **dark mode**; an explicit Light/Dark choice is remembered in
`localStorage["marketcap.theme"]`.

## 4. Where things live

```
app/
  layout.tsx              root layout: fonts, theme bootstrap script (dark default)
  globals.css             design tokens (:root / .dark) + Tailwind @theme mapping
  page.tsx                Overview route
  watchlist/page.tsx      My Stock route
  portfolio/page.tsx      Portfolio route (search, form, table, totals)
  stocks/[ticker]/page.tsx Suspense wrapper + static params
  api/quotes/route.ts     batched quotes, cache, stale fallback
  api/profile/route.ts    company profile + metrics
  api/news/route.ts       company or general news
  api/search/route.ts     symbol search
  api/candles/route.ts    Yahoo intraday OHLC, cache
components/
  app-shell.tsx           sidebar + mobile header + content frame
  sidebar.tsx             desktop nav, placeholder "Soon" items, theme toggle
  mobile-nav.tsx          mobile pill nav
  dashboard-live.tsx      Overview data wiring, totals, history recording
  portfolio-values.tsx    Portfolio card on the dashboard
  statistics-chart.tsx    Portfolio value chart (derived from real observations)
  stock-table.tsx         Dashboard holdings table
  stock-detail.tsx        Stock page composition + data fetching
  candle-chart.tsx        SVG candlesticks with OHLC hover
  line-chart.tsx          SVG line/area chart (history card)
  stock-actions.tsx       Add to watchlist / portfolio
  updated-ago.tsx         "Updated Xs ago · refreshes every 30s"
  theme-toggle.tsx        Light/Dark switch
  icons.tsx               inline SVG icons and brand marks
lib/
  use-live-quotes.ts      polling hook (30s, batching, visibility refresh)
  use-local-store.ts      localStorage-backed list store
  use-value-history.ts    portfolio value observations (max 1/minute)
  theme.ts                theme external store
  stores.ts               keys, Position type, seeded defaults
  market-data.ts          ticker → name catalogue, quote lookup helper
  dashboard-data.ts       currency/percent formatting only
```

## 5. Environment

| Variable | Where | Purpose |
|----------|-------|---------|
| `FINNHUB_API_KEY` | `.env.local` locally, Netlify env vars in production | Finnhub free-tier key. Never exposed to the browser. |

No other secrets. Yahoo needs no key. `.env*` is git-ignored except `.env.example`.

There is no database, so nothing to migrate. If Supabase is added, expect
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser) and
`SUPABASE_SERVICE_ROLE_KEY` (server only, never in client bundles).

## 6. Known constraints and sharp edges

1. **Finnhub free tier is 60 calls/minute for the whole key** (plus 30/second), and every ticker
   costs one call. The 20-second quote cache exists to make 30-second polling affordable across
   tabs and visitors — do not remove it without redoing that maths.
2. **No historical candles from Finnhub** (`403`). They come from an unofficial Yahoo endpoint that
   can throttle or change without notice. Failures degrade to "No candle data available".
3. **Both providers are personal-use licensed.** Public/commercial use needs a licensed feed or the
   TradingView widget.
4. **Next 16 `cacheComponents`** rejects `export const dynamic` / `dynamicParams`. The stock route
   reads `params` inside `<Suspense>`. Do not reintroduce those exports.
5. **ESLint `react-hooks` rules are strict**: no `Date.now()`/`new Date()` during render, no
   synchronous `setState` in an effect body (use timers/promises), and effects must list their deps.
6. **Data is per browser.** Clearing site data resets the portfolio and watchlist to the four
   defaults. There is no cross-device sync yet.

## 7. Recommended next steps

1. **Supabase**: project, `positions` / `watchlist` tables, row-level security on `auth.uid()`,
   email+password and Google sign-in, then move `useLocalStore` behind server actions. This is the
   single biggest gap and unblocks deployment beyond personal use.
2. **Caches + auth together**: per-user data plus the existing quote cache means one Finnhub key can
   serve many users; keep the cache layer.
3. Dashboard market-news card — `/api/news` already returns general news when no symbol is passed.
4. Top movers — needs a symbol universe; decide between a fixed watch universe and a paid screener.
5. Optional: websocket streaming for the four market cards (Finnhub free allows 50 symbols, but the
   token must stay server-side, so it needs an SSE proxy), or TradingView widget for richer charts.
6. Add tests around `/api/quotes` caching, `/api/candles` parsing, and the portfolio maths before
   any refactor.

## 8. Handover checklist

- [x] Repo pushed, `main` deployable
- [x] `.env.example` documents the only secret
- [x] Data provenance documented ([`DATA.md`](./DATA.md))
- [x] Architecture and data flow documented ([`ARCHITECTURE.md`](./ARCHITECTURE.md))
- [x] Setup, scripts and deploy documented ([`DEVELOPMENT.md`](./DEVELOPMENT.md))
- [ ] Tests
- [ ] Auth + database
- [ ] Provider licence for public use
