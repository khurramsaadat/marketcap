# Development guide

Setup, conventions, checks and deployment. Architecture lives in
[`ARCHITECTURE.md`](./ARCHITECTURE.md); the project overview is in [`HANDOVER.md`](./HANDOVER.md).

## 1. Prerequisites

- Node.js 20.9+ (Next 16 requirement), npm.
- A free [Finnhub](https://finnhub.io/register) API key (quotes, profile, news, search).
- No other accounts. Yahoo candles need no key; no database is used yet.

## 2. First run

```bash
npm install
cp .env.example .env.local     # then paste your Finnhub key
npm run dev -- -p 4310         # port 3000 is often taken by another local app
```

Open http://localhost:4310. The feed is live, so a wrong key shows "—" / "Waiting for a quote…"
rather than fake numbers.

### Environment variables

| Name | Scope | Notes |
|------|-------|-------|
| `FINNHUB_API_KEY` | server only | Read inside `app/api/*` route handlers. `.env*` is git-ignored except `.env.example`. |

Never expose this key with a `NEXT_PUBLIC_` prefix — the browser must keep calling your own routes.

## 3. Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Next dev server (use `-- -p 4310` locally) |
| `npm run build` | Production build — the definitive compile check |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (includes the strict `react-hooks` rules) |

There is no test suite yet. The expected pre-push gate is:

```bash
npm run lint && npm run build
```

## 4. Quick verification with curl

```bash
curl "localhost:4310/api/quotes?tickers=AAPL,MSFT"          # live quotes + cached count
curl "localhost:4310/api/profile?symbol=AAPL"               # profile + metrics
curl "localhost:4310/api/news?symbol=AAPL"                  # headlines
curl "localhost:4310/api/search?q=apple"                    # symbol search
curl "localhost:4310/api/candles?symbol=AAPL&range=1d"      # 5m OHLC bars
```

Second identical quote/candle call should report `"cached": true`.

## 5. Code conventions

- **TypeScript strict**; no `any` in route payloads — extend the local types instead.
- **Server components by default.** Add `"use client"` only where you need state, effects or events.
- **Colours come from tokens**, not hex values: use `bg-surface`, `text-muted`, `border-line`,
  `text-up`… and add new tokens to **both** `:root` and `.dark` in `app/globals.css`.
- **Formatting helpers**: `formatCurrency` / `formatPercent` from `lib/dashboard-data.ts`; the
  `Stat` and table components handle "—" for missing values.
- **Quote access**: `useLiveQuotes(tickers)` returns `{ quotes, updatedAt }`; never fetch Finnhub
  directly from a component.
- **Local persistence**: `useLocalStore(KEY, seed)`; keys are defined in `lib/stores.ts`.

### Lint rules that will bite

These are real, not style preferences:

1. **No impure calls in render** — `Date.now()`, `new Date()` and `Math.random()` must run inside
   effects, timers or handlers (see `components/updated-ago.tsx`).
2. **No synchronous `setState` in an effect body** — trigger it from a timer or promise callback.
3. **Exhaustive deps** — list every value the effect reads.
4. **Next 16 `cacheComponents`** — `export const dynamic` and `dynamicParams` are rejected. Read
   `params` inside `<Suspense>` (see `app/stocks/[ticker]/page.tsx`).

## 6. Adding a screen

1. `app/<route>/page.tsx` returning `<AppShell>…</AppShell>`.
2. Add the entry to `components/sidebar.tsx` (and `components/mobile-nav.tsx` if it belongs on
   mobile).
3. If it shows prices, call `useLiveQuotes(...)` and render `<UpdatedAgo at={updatedAt} />` so the
   refresh cadence stays visible.
4. Check both themes and a 390 px viewport before calling it done.

## 7. Deployment

Hosted on **Netlify** at https://marketcap-zeroone.netlify.app/, connected to `main` on
https://github.com/khurramsaadat/marketcap.

1. Netlify → Site configuration → Environment variables → `FINNHUB_API_KEY`.
2. Push to `main`; Netlify's Next.js runtime builds and deploys automatically.
3. Verify after deploy:

```bash
curl "https://marketcap-zeroone.netlify.app/api/quotes?tickers=AAPL"    # "source":"finnhub"
curl "https://marketcap-zeroone.netlify.app/api/candles?symbol=AAPL&range=1d"
```

If `/api/quotes` returns `"source":"unconfigured"`, the environment variable is missing or the
deploy predates it.

**Caveats**

- The quote/candle caches are module-scoped, so on serverless they are per warm instance — good at
  absorbing bursts, not a global shared cache.
- Yahoo's endpoint occasionally throttles from cloud IP ranges. The chart degrades to a message; it
  never draws invented data.
- Both data providers are licensed for **personal** use. Going public or commercial requires a
  licensed feed or the TradingView widget.

## 8. Git workflow

- Conventional-ish short subjects, one logical change per commit.
- Do not commit `.env.local`, `.dev.log` or review screenshots. Snapshots live in `screenshots/`
  (`light/` and `dark/`) and are git-ignored — they are reference material, not app assets.
- Run `npm run lint && npm run build` before pushing.

## 9. Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| Prices show "—", `source: "unconfigured"` | `FINNHUB_API_KEY` missing for that environment |
| Quotes stop updating | Finnhub 429: too many calls for the key. Check the 20 s cache is intact and that no loop bypasses `/api/quotes` |
| Chart says "Yahoo Finance rate-limited" | Yahoo throttled the cloud IP; it recovers on the next range switch or reload |
| Theme looks stale after editing `globals.css` | Restart the dev server — a cached CSS chunk can outlive an HMR update |
| Port already in use | `npm run dev -- -p 4310` (the repo's usual port) |
| `dynamic` export rejected | Next 16 `cacheComponents`; move data reading under `<Suspense>` |
| Portfolio empty for one browser | Data is in `localStorage`; clearing site data restores the four seeded defaults |
