# MarketCap — Captured Inputs

This file records the requirements and decisions given during the build conversation.
Source of truth for `PRD.md` and `Plan.md`.

## 1. Initial brief

> "I want to build a stock investment app similar to https://www.google.com/finance/. Let's call it
> MarketCap. It has live pricing, news and ability to save stocks to my portfolio."

## 2. Clarifying answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Authentication | Supabase auth + row-level security. Email/password **and** Google social sign-in. |
| 2 | Supabase project | "Not yet" — project has to be created before this work is done. |
| 3 | Market data provider | Finnhub free tier. User has an API key. |
| 4 | News source | Same provider as pricing (Finnhub). |
| 5 | Framework / styling | Latest Next.js and TailwindCSS. |
| 6 | Real-time updates | Polling every 30 seconds. |
| 7 | Portfolio fields | Ticker + quantity, cost basis, purchase date, target price. |
| 8 | Gain / loss | Auto-compute from the current Finnhub price ("use your best judgement" → computed). |
| 9 | Target price behaviour | Yes — visual alert on the dashboard when price crosses the target. |
| 10 | News filtering | Both: per-stock news **and** a general market feed on the dashboard. |
| 11 | Top movers | Yes — gainers/losers section on the home page. |
| 12 | UI reference | https://www.google.com/finance for patterns. |

## 3. Design reference

`ref.jpg` (in the repository root) is the visual reference: the "Investa" dashboard.
Requirements taken from it:

- Light, airy surface with a soft lavender/pink gradient wash at the bottom.
- Left sidebar: purple logo mark + wordmark, nav (Overview, My Stock, Portfolio [active],
  Analytic, Community, Account), a "Files" group with a `+` action (Communication, Affiliates,
  Marketing).
- Row of four holding cards: brand logo, ticker, company name, large value, change vs last month.
- Two-column row: "Portfolio Values" card (total, mint change badge, copy, Worst/Top Performance
  pills, lavender insight callout) and a "Statistics" area chart with dashed grid, 0–80k axis,
  Dec 2–8 labels, dashed marker and a dark `25.5k` tooltip.
- "My Stock" table with sortable headers: Name Stock, Invest Date, Volume, Change, Price/stock.
- Rounded 16–20px cards, hairline borders, soft shadows, tabular figures.

## 4. Follow-up instructions

1. "Before you build the app, build the front end dashboard … I want the app to follow this design."
2. "What is next step? why did you stop" → continue building the rest of the front end.
3. "I have placed the api key — FINNHUB_API_KEY from .env.local" → wire live Finnhub data.
4. "Please push all code to my GitHub repo" → https://github.com/khurramsaadat/marketcap.git
5. "Did you create all the markdown files I requested … I want to see them and I want to see the
   progress in it" → this file, `PRD.md`, `Plan.md`.

## 5. Assumptions made (not explicitly confirmed)

- Portfolio positions are tracked manually (no brokerage connection or real order execution).
- "Cost basis" is the **total** amount paid for the position, not per-share.
- "Target price" is a personal alert threshold, not an order.
- Currency is USD only; no multi-currency or FX handling.
- Prices refresh on a 60-second poll; there is no exchange-grade streaming feed.
- The app is a portfolio tracker/reader, not investment advice or a trading venue.

## 6. Out of scope for now

- Real trading, brokerage linking, order routing.
- Billing, subscriptions, teams or sharing.
- Mobile apps, push notifications, emails.
- Multi-currency, dividends, tax lots, corporate actions.
