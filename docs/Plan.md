# MarketCap — Build Plan & Progress

**Stack:** Next.js 16.4.6 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 ·
Finnhub (quotes/news/search) · Yahoo Finance (intraday candles) · Supabase (auth + Postgres + RLS,
pending) · Netlify (deployed)

Legend: ✅ done · 🟡 partial · ⬜ not started

---

## Progress snapshot

| Stage | Area | Status | Notes |
|-------|------|--------|-------|
| 0 | Requirements & design reference | ✅ | `docs/input.md`, `docs/PRD.md`, `ref.jpg` |
| 1 | Project scaffold | ✅ | Next 16 + Tailwind v4 + TS + ESLint, `npm run build` clean |
| 2 | Dashboard UI | ✅ | Matches `ref.jpg`: sidebar, cards, portfolio values, chart, table |
| 3 | App shell & routed pages | ✅ | `/`, `/watchlist`, `/portfolio`, `/stocks/[ticker]` |
| 4 | Live market data (Finnhub + Yahoo) | ✅ | Quotes, profile, news, search, candles; 30s polling with a 20s server cache |
| 5 | Supabase project & schema | ⬜ | Needs the Supabase project (blocked on credentials) |
| 6 | Auth flows (email + Google) | ⬜ | Depends on stage 5 |
| 7 | Per-user persistence + RLS | ⬜ | Replace `localStorage` store; verify two-account isolation |
| 8 | Remaining product features | 🟡 | Portable search done; screener, top movers and market-news card outstanding |
| 9 | Deployment | ✅ | Netlify: https://marketcap-zeroone.netlify.app (auto-deploy from `main`) |
| 10 | QA & polish | 🟡 | Dark mode, colour-coded news sources, empty/loading states done; a11y pass and tests outstanding |

**Overall:** the whole user-facing front end, theming and the market data layer are working. Auth,
per-user persistence (RLS), the screener and tests are outstanding.

---

## Stage 0 — Requirements & reference ✅

- [x] Capture brief and clarifying answers → `input.md`
- [x] Write product requirements → `PRD.md`
- [x] Study `ref.jpg` (Investa dashboard) and extract layout, palette, type, chart, table rules

## Stage 1 — Scaffold ✅

- [x] `create-next-app` (Next 16.4.6, TypeScript, Tailwind v4, App Router, ESLint)
      *note:* the CLI refuses non-empty folders, so it scaffolded into `scaffold-tmp/` and the
      files were moved to the repo root
- [x] Install with bun/npm; keep the lockfile
- [x] Geist via `next/font`, metadata set to MarketCap
- [x] Tailwind theme tokens in `app/globals.css`

## Stage 2 — Dashboard UI ✅

- [x] `components/sidebar.tsx` — logo mark, primary nav, Files group, active pill
- [x] `components/stock-card.tsx` — brand mark, ticker/name, value, change vs last month
- [x] `components/portfolio-values.tsx` — total, mint badge, pills, lavender callout
- [x] `components/line-chart.tsx` + `components/statistics-chart.tsx` — smooth SVG area chart,
      dashed grid, 0–80k axis, Dec 2–8 labels, marker + `25.5k` tooltip
- [x] `components/stock-table.tsx` — sortable-looking header, change pills, right-aligned price
- [x] `components/icons.tsx` — stroke icons and inline Apple/Google/Spotify/Twitter marks
- [x] Verified by screenshot at 1440px against `ref.jpg`

## Stage 3 — App shell & routed pages ✅

- [x] `components/app-shell.tsx` — sidebar + mobile header shared by every page
- [x] Sidebar becomes a client component with `usePathname` active state and `next/link`
- [x] `/portfolio` — summary tiles, positions table, add-position form, target-hit badge, remove
- [x] `/watchlist` — add via input + datalist, live rows, remove, link through
- [x] `/stocks/[ticker]` — hero stats, chart, news, about, add-to-watchlist/portfolio actions
- [x] `lib/stores.ts` + `lib/use-local-store.ts` — shared seeds and a `useSyncExternalStore`
      browser store (interim persistence)
- [x] `generateStaticParams()` for all catalogue tickers (required by Next 16 `cacheComponents`)

## Stage 4 — Live market data ✅

- [x] `app/api/quotes/route.ts` — batched `/quote` (≤12 tickers), per-ticker failure isolation
- [x] `app/api/news/route.ts` — `/company-news` per symbol or `/news?category=general`
- [x] `app/api/search/route.ts` — symbol search filtered to common stock
- [x] Key stays server-side via `FINNHUB_API_KEY` in `.env.local` (gitignored)
- [x] `lib/use-live-quotes.ts` — fetch immediately then every 30s, keep last known values, refresh on tab focus
- [x] `app/api/candles/route.ts` — Yahoo intraday OHLC (5m/15m/60m), 45s cache, stale fallback
- [x] Quote cache: 20s per ticker, in-flight de-duplication, 5-minute stale fallback
- [x] Wired into dashboard cards, watchlist and portfolio (value, gain/loss, target hit)
- [x] Verified live: AAPL $354.88, NVDA $166.19, MSFT $523.00; news and search return real data

## Stage 5 — Supabase project & schema ⬜

Blocked on: the Supabase project being created (URL, anon key, service-role key).

- [ ] Create the project and store `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- [ ] Install `@supabase/supabase-js` + `@supabase/ssr`
- [ ] Create `profiles`, `watchlist`, `positions`, `news` (SQL in `PRD.md` §6)
- [ ] Enable RLS and add select/insert/update/delete policies on `auth.uid() = user_id`
- [ ] Trigger to insert a `profiles` row on signup

## Stage 6 — Auth flows ⬜

- [ ] Supabase browser/server clients; session refresh middleware
- [ ] `/signin` with email + password and Google OAuth button
- [ ] `/api/auth/callback` exchange; sign-out action
- [ ] Protect `/portfolio`, `/watchlist`, `/stocks/*`; header shows the user
- [ ] Register localhost + deployed callback URLs in Supabase

## Stage 7 — Per-user persistence ⬜

- [ ] Replace `useLocalStore` reads/writes with Supabase queries scoped to the session user
- [ ] Migrate add/remove position and watchlist actions to server actions or route handlers
- [ ] Verify RLS: two accounts cannot read each other's rows (direct REST calls too)

## Stage 8 — Remaining product features 🟡

- [x] Portfolio fields: quantity, total cost basis, purchase date, target price
- [x] Auto gain/loss from live price; target-hit badge
- [x] Stock page uses live quote + `/api/profile` metrics + `/api/news` headlines
- [x] Live price polling on the stock detail page (30s via `useLiveQuotes`)
- [x] Removed every invented market figure (see `DATA.md` → “Mock data that was removed”)
- [x] Dashboard portfolio value, gain/loss and table computed from your positions + live quotes
- [ ] Top movers (gainers/losers) on the home page — needs a fixed watch universe on the free tier
- [ ] General market news feed card on the dashboard (route already exists)
- [x] Search UI — portfolio search box filters positions and suggests symbols from `/api/search`
- [ ] Screener: full US symbol list with logos, search and paging (planned, see `HANDOVER.md`)
- [ ] Brand marks for the remaining tickers (NVDA, MSFT, AMZN, TSLA, …) instead of initials

## Stage 9 — Deploy ✅

- [x] Hosted on Netlify: https://marketcap-zeroone.netlify.app (auto-deploy from `main`)
- [x] `FINNHUB_API_KEY` set in Netlify environment variables; verified live via `/api/quotes`
- [x] Production build verified locally (`npm run build`)
- [ ] Re-verify after the next deploy: candles, dark theme, seeded defaults
- [ ] Optional: migrate to Freebuff Sites (`sites_prepare_next` + secret + preview checks)

## Stage 10 — QA & polish 🟡

- [x] Loading states and empty states for watchlist/portfolio; skeleton on the stock route
- [x] Error surfaces for Finnhub (per-ticker skip, stale fallback) and Yahoo (chart message)
- [x] Dark theme across every screen, colour-coded news sources, compact type
- [x] README, handover docs, data provenance and this plan
- [ ] Keyboard/a11y pass on forms and the table
- [ ] Automated tests (quote cache, candle parsing, portfolio maths)

---

## File map

```
app/
  page.tsx                dashboard
  watchlist/page.tsx      watchlist
  portfolio/page.tsx      positions, add form, gain/loss
  stocks/[ticker]/page.tsx stock detail (prerendered per ticker)
  api/quotes|news|search  Finnhub proxy routes (dynamic, key server-side)
  layout.tsx globals.css  shell + Tailwind tokens
components/               sidebar, app-shell, cards, table, charts, icons, actions
lib/                      dashboard-data, market-data, stores, hooks, polling, tone
/docs/                    HANDOVER, ARCHITECTURE, DEVELOPMENT, PRD, Plan, DATA, input
README.md                 project overview (repo home page)
ref.jpg                   design reference
screenshots/              review snapshots (git-ignored)
```

## How to verify

```bash
npm install
npm run lint && npm run build          # lint + production build
npm run dev -- -p 4310                 # dev server (3000 may be occupied)
curl "localhost:4310/api/quotes?tickers=AAPL,MSFT"
curl "localhost:4310/api/news?symbol=AAPL"
curl "localhost:4310/api/search?q=apple"
```

## Known deviations / decisions

1. Prices are polled every 30s with a 20s server-side cache; no websocket/streaming feed (per the brief).
2. Portfolio and watchlist persist in `localStorage` until Supabase auth lands — they are not yet
   per-user or cross-device.
3. Finnhub's free plan blocks `/stock/candle`, so candles come from Yahoo Finance's public chart
   endpoint (keyless, cached 45s). Nothing synthetic is drawn; if Yahoo fails the panel says so.
4. `cacheComponents` in Next 16 rejects `dynamic`/`dynamicParams` route configs and client hooks
   outside Suspense, so the stock route reads `params` inside a `<Suspense>` boundary and passes the
   ticker to a client component.
5. Review screenshots are kept in `screenshots/light/` and `screenshots/dark/`, which is git-ignored
   by design — they are reference material, not part of the build.

## Changelog

- **2026-11-13** — Repo created and pushed (`https://github.com/khurramsaadat/marketcap.git`);
  dashboard, app shell, watchlist, portfolio, stock detail and live Finnhub integration shipped;
  `PRD.md`, `Plan.md`, `input.md` added.
- **2026-11-13** — Removed all mock market data. Added `/api/profile` and `/api/candles`, moved the
  stock page and dashboard onto live sources, made the statistics chart plot only recorded live
  observations, and documented provenance in `DATA.md`.
- **2026-11-13** — Portfolio-wide bug pass (phantom totals, mobile nav, dead controls, validation).
- **2026-11-13** — Dark theme with semantic tokens, portfolio stock search, 30s refresh with an
  "Updated Xs ago" label and a 20s server-side quote cache.
- **2026-11-13** — Real intraday candlesticks from Yahoo (`1d`/`5d`/`1mo`), replacing the
  "not in the free plan" notice.
- **2026-11-13** — Four seeded positions and watchlist tickers, dark mode as the default, handover
  docs (`docs/HANDOVER.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`), screenshots moved to a
  git-ignored `screenshots/` folder, colour-coded news sources and compact news/company panels.
