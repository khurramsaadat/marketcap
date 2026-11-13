# MarketCap — Product Requirements Document

**Status:** Front end and live market data are built; Supabase auth/RLS and deployment remain.
**Last updated:** 2026-11-13
**Inputs:** see `input.md` · **Roadmap:** see `Plan.md` · **Data provenance:** see `DATA.md`

---

## 1. Overview

MarketCap is a stock investment dashboard: search quotes, follow a watchlist, track a portfolio
against cost basis and target prices, and read market news — modelled on Google Finance and the
`ref.jpg` dashboard design.

**Current state:** a working Next.js app with a routed shell, four pages, live Finnhub quotes,
company profiles, metrics and news polled every 60 seconds, and browser-local portfolio/watchlist
storage. Authentication, per-user database rows and hosting are not wired yet. No invented market
data is displayed anywhere — see `DATA.md`.

## 2. Goals

1. See live prices and daily change for any followed stock within one screen.
2. Track positions (quantity, cost basis, purchase date, target price) and see gain/loss and
   target-hit status at a glance.
3. Follow stocks in a watchlist and read per-stock plus general market news.
4. Keep every user's watchlist and portfolio private — enforced in the database, not just the UI.
5. Ship on Freebuff Sites with the Finnhub key held server-side.

## 3. Non-goals

- Placing trades, connecting brokerages, or holding funds.
- Investment advice, recommendations, or performance guarantees.
- Billing, teams, sharing, mobile native apps, email/push alerts.
- Multi-currency, dividends, tax lots, corporate actions.

## 4. Users

- **Individual investor (primary):** holds a handful of tickers, wants a fast overview and a
  target price reminder. Signs in with email or Google.
- **Researcher (secondary):** browses quotes and news without necessarily adding positions.

## 5. Functional requirements

Legend: ✅ done · 🟡 partial · ⬜ not started

| ID | Requirement | Acceptance criteria | Status |
|----|-------------|---------------------|--------|
| F1 | Dashboard matches the reference design | Sidebar, four holding cards, Portfolio Values + Statistics row, My Stock table, light lavender-washed surface | ✅ |
| F2 | Routed app shell | Sidebar links to `/`, `/watchlist`, `/portfolio`; active item highlighted; mobile header on small screens | ✅ |
| F3 | Live quotes | Prices and change % for up to 12 tickers per request, sourced from Finnhub via a server route; when the key is absent the UI shows “—” rather than invented prices | ✅ |
| F4 | 60-second polling | Dashboard cards, watchlist and portfolio refresh every 60s and keep last-known values on failure | ✅ |
| F5 | Watchlist | Add ticker (datalist suggestions), remove, live price + change, link to stock page | ✅ 🟡 local storage only |
| F6 | Portfolio | Add position (ticker, quantity, **total** cost basis, purchase date, optional target); value, gain/loss % and target-hit computed from the live price | ✅ 🟡 local storage only |
| F7 | Target price alert | "Target hit" badge when live price ≥ target on the portfolio page and dashboard summary | ✅ |
| F8 | Per-stock news | Headlines for the selected ticker from Finnhub company-news | 🟡 API ready, stock page still renders catalogue news |
| F9 | General market news | Market feed on the dashboard | 🟡 API ready, dashboard not wired |
| F10 | Top movers | Gainers/losers section on the home page | ⬜ |
| F11 | Stock detail page | Live price, day range, previous close, market cap, P/E, beta, dividend yield, 52-week range, company profile and real headlines; add to watchlist/portfolio | ✅ chart shows a plan notice when candles are blocked |
| F12 | Search | Ticker/company search from the header | 🟡 `/api/search` ready, no UI |
| F13 | Auth (email/password) | Sign up, sign in, sign out, session-aware header | ⬜ |
| F14 | Auth (Google) | OAuth sign-in through Supabase | ⬜ |
| F15 | Row-level security | Every user-owned table readable/writable only by `auth.uid() = user_id` | ⬜ |
| F16 | Per-user persistence | Watchlist and portfolio survive sign-out/sign-in across devices | ⬜ |
| F17 | Deployment | Published on Freebuff Sites with `FINNHUB_API_KEY` in Secrets | ⬜ |
| F18 | No invented market data | Every displayed figure is live, user-entered or derived from a live value; unavailable data shows an explicit notice | ✅ |

## 6. Data model (Supabase Postgres — planned)

```sql
create extension if not exists "uuid-ossp";

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  created_at timestamptz default now()
);

create table watchlist (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  created_at timestamptz default now(),
  unique (user_id, ticker)
);

create table positions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  quantity numeric not null check (quantity > 0),
  cost_basis numeric not null check (cost_basis >= 0), -- total paid
  purchase_date date,
  target_price numeric check (target_price > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table news (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  ticker text,
  title text not null,
  source text,
  url text not null,
  summary text,
  published_at timestamptz,
  fetched_at timestamptz default now()
);
```

**RLS pattern for every owner table:**

```sql
alter table positions enable row level security;

create policy "read own"   on positions for select using (auth.uid() = user_id);
create policy "insert own" on positions for insert with check (auth.uid() = user_id);
create policy "update own" on positions for update using (auth.uid() = user_id);
create policy "delete own" on positions for delete using (auth.uid() = user_id);
```

## 7. API contracts

| Route | Query | Returns | Key held |
|-------|-------|---------|----------|
| `GET /api/quotes` | `tickers=AAPL,MSFT` (≤12) | `{ quotes: { [ticker]: { price, change, changePct, previousClose, high, low } }, source }` | server-side |
| `GET /api/news` | `symbol=AAPL` or none for market | `{ items: [{ title, source, summary, url, datetime, ticker }], source }` | server-side |
| `GET /api/search` | `q=apple` | `{ results: [{ ticker, name, type }] }` | server-side |

All responses are `cache-control: no-store`; missing key returns an empty result set with
`source: "unconfigured"` so the UI can fall back without an error state.

## 8. Design requirements

- Palette: ink `#101828`, muted `#667085`, line `#ecedf1`, canvas `#f6f7f9`, accent `#6c3bf4`,
  up `#128a4b` / `#e7f7ee`, down `#d92d20` / `#fdecec`.
- Typography: Geist (already wired through `next/font`), tabular numerals for all figures.
- Cards: 16–20px radius, hairline border, `0 1px 2px rgba(16,24,40,.04)` shadow.
- Charts: hand-built SVG area charts with gradient fill and dashed grid (no chart dependency).
- Responsive: 4-up → 2-up → 1-up card grid; sidebar collapses under 1024px; tables scroll.

## 9. Non-functional requirements

- **Security:** Finnhub key never reaches the browser; Supabase anon key only; service-role key
  server-only; user data scoped by RLS; personalized responses `no-store`.
- **Performance:** every page prerenders where possible (only API routes are dynamic);
  quotes batched to respect Finnhub's 60 req/min free tier.
- **Reliability:** failed quote fetches are skipped per ticker; the UI never blanks out — it keeps
  the last known price or falls back to the catalogue.
- **Accessibility:** semantic landmarks, labelled form fields, `role="status"` feedback, SVG charts
  with `role="img"` labels.

## 10. Success criteria

- Sign in with email and with Google; sign out clears the session.
- Two accounts never see each other's watchlist, positions or news rows (verified with RLS).
- A position's gain/loss and target-hit badge match the live price within one polling cycle.
- Deployed build returns 200 for all pages with quotes and news loading server-side.

## 11. Risks and open questions

1. **Finnhub free tier** caps at 60 req/min and some symbols return `c = 0`; batches and per-ticker
   skips are already in place, but heavy watchlists will need caching.
2. **Google OAuth** requires redirect URLs registered for both localhost and the deployed origin.
3. **Top movers** needs a symbol universe; Finnhub's free tier has no screener, so this will use a
   fixed watch universe unless a different endpoint is available.
4. **Intraday candles** are plan-restricted on Finnhub's free tier, so the stock page shows a notice
   instead of a chart. A paid plan or a different provider is required to plot price history.

## 12. Data provenance

`DATA.md` lists every field on screen and whether it is live (Finnhub), user-entered, derived from
live values, static reference data, or unavailable on the current plan. It also records the mock
data that was removed when the app moved to live sources.
