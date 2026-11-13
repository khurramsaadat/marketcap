# Architecture

How MarketCap is put together. For the product view see [`PRD.md`](./PRD.md); for setup and deploy
see [`DEVELOPMENT.md`](./DEVELOPMENT.md).

## 1. Shape of the app

Next.js App Router with **server-rendered shells** and **client components for anything that polls**.

```
Browser
  ├── server component page (layout, headings, static shell)
  └── client component (data, polling, forms, charts, theme)
        └── fetch("/api/...")            ← same origin, no keys in the browser
              └── route handler (Node runtime)
                    └── Finnhub / Yahoo   ← FINNHUB_API_KEY stays here
```

The browser never talks to a provider directly. That is what keeps the API key private and lets the
route handlers cache, batch and degrade gracefully.

## 2. Request paths

| Route | Type | Client component | Data |
|-------|------|------------------|------|
| `/` | server page | `dashboard-live.tsx` | quotes for market watch + positions, localStorage portfolio, derived history |
| `/watchlist` | server page | page itself (`use client`) | quotes for watchlist tickers |
| `/portfolio` | server page | page itself (`use client`) | quotes for positions, search suggestions |
| `/stocks/[ticker]` | server page + `<Suspense>` | `stock-detail.tsx` | quote, profile, news, candles |

`app/stocks/[ticker]/page.tsx` awaits `params` inside a Suspense boundary (a `cacheComponents`
requirement) and renders `<StockDetail key={ticker}>` so switching symbols resets fetched state
instead of briefly showing the previous company.

## 3. API contracts

All handlers return JSON, `cache-control: no-store`, and never throw to the client.

### `GET /api/quotes?tickers=AAPL,MSFT`

One Finnhub `/quote` call **per ticker** (Finnhub has no multi-symbol quote). Max 12 tickers per
request; the client batches in groups of 12.

```json
{
  "quotes": {
    "AAPL": { "ticker": "AAPL", "price": 354.88, "change": -0.75, "changePct": -0.2109,
              "previousClose": 355.63, "high": 359.37, "low": 354.41 }
  },
  "source": "finnhub",
  "fetchedAt": 1794575766061,
  "cached": 2
}
```

Caching behaviour in `app/api/quotes/route.ts`:

| Layer | Rule |
|-------|------|
| Fresh cache | 20 s per ticker, module-scoped `Map` |
| In-flight dedupe | concurrent requests for one symbol share a single upstream call |
| Stale fallback | on 429/network error, serve the last price for up to 5 minutes |
| Bounds | entries older than the stale window are pruned past 500 keys |

Why 20 s: the free tier allows 60 calls/minute for the whole key. With a 30 s client poll and a
20 s cache, a single tab costs one call per ticker per poll, while extra tabs and visitors inside the
window cost nothing. Unconfigured key → `{ quotes: {}, source: "unconfigured" }`.

### `GET /api/profile?symbol=AAPL`

Fetches `/stock/profile2` plus `/stock/metric?metric=all` and normalises them into one object:
`ticker, name, exchange, industry, country, currency, ipo, website, marketCap, pe, yearHigh,
yearLow, beta, dividendYield`. Missing fields are `null` and the UI renders "—".

### `GET /api/news?symbol=AAPL` (or no symbol for market news)

Company news for the last 7 days, or `/news?category=general` when the symbol is absent/malformed.
Returns `{ items: [{ title, source, summary, url, datetime, ticker }], source }`, capped at 12.

### `GET /api/search?q=apple`

Thin pass-through to Finnhub `/search`: `{ results: [{ ticker, name, type }] }`. Used by the
portfolio search box (debounced 250 ms in the client).

### `GET /api/candles?symbol=AAPL&range=1d|5d|1mo`

Yahoo Finance chart endpoint (Finnhub's candle endpoint is plan-restricted).

| `range` | Yahoo span | Interval | Typical bars |
|---------|-----------|----------|--------------|
| `1d` | 1d | 5m | ~78 |
| `5d` | 5d | 15m | ~130 |
| `1mo` | 1mo | 60m | ~160 |

```json
{
  "available": true,
  "candles": [{ "t": 1794493800000, "o": 357.71, "h": 359.02, "l": 355.92, "c": 357.47, "v": 2728835 }],
  "interval": "5m",
  "timeZone": "America/New_York",
  "previousClose": 355.63,
  "cached": false,
  "asOf": 1794576000000
}
```

Details that matter:

- Null bars (holidays, halts) and Yahoo's zero-volume placeholder at the live price are dropped.
- `timeZone` comes from the response so the chart labels show **exchange** time, not the viewer's.
- Cache: 45 s per `symbol:range`, in-flight dedupe, 10-minute stale fallback.
- Failure shapes: `{ available: false, reason: "throttled" | "unavailable" | "no-data" |
  "network-error" | "bad-symbol" }` — the panel shows a human message for each.

## 4. Client data layer

`lib/use-live-quotes.ts`

- `POLL_MS = 30_000`, exported as `POLL_SECONDS` for UI copy.
- Splits any ticker list into batches of 12 and merges the responses.
- `busy` guard prevents overlapping polls; `visibilitychange` triggers an immediate refresh when a
  background tab returns.
- Keyed on the sorted, de-duplicated ticker list so re-ordering does not restart polling.
- Returns `{ quotes, updatedAt }`; `updatedAt` is refreshed only when data actually arrives, which
  is what `components/updated-ago.tsx` displays ("Updated 7s ago · refreshes every 30s").

`lib/use-local-store.ts`

`useSyncExternalStore` over `localStorage` + an in-memory `Map`. Server snapshot is the seed, so SSR
renders the default rows and hydration swaps in stored data if present. One key per collection:

| Key | Contents |
|-----|----------|
| `marketcap.portfolio` | `Position[]` (id, ticker, quantity, costBasis, purchaseDate, targetPrice) |
| `marketcap.watchlist` | `string[]` of tickers |
| `marketcap.value-history` | portfolio value observations, capped at one per minute |
| `marketcap.theme` | `"light"` or `"dark"` |

`costBasis` is the **total** paid for the position, so gain = `price × quantity − costBasis`.

## 5. Portfolio maths

`dashboard-live.tsx` and `portfolio/page.tsx` both compute totals the same way:

```
for each position with a live price:
    invested += costBasis
    value    += price × quantity
gain = value − invested ; gainPct = gain / invested × 100
```

Positions without a quote are excluded from **both** sides, so a pending fetch can never read as a
total loss. The UI shows "Some positions have no live quote yet" instead. History recording also
waits until every position is priced, so partial totals never pollute the chart.

## 6. Theming

- Tokens live in `app/globals.css`: `:root` for light, `.dark` for dark —
  `--ink, --ink-soft, --muted, --faint, --line, --canvas, --surface, --surface-muted, --accent,
  --accent-strong, --accent-soft, --accent-ink, --up, --up-soft, --down, --down-soft, --on-accent`.
- Tailwind consumes them through `@theme inline` (`--color-surface: var(--surface)`), so utilities
  like `bg-surface`, `text-muted`, `border-line` flip automatically.
- **Never hardcode a hex colour in a component** — add a token in both `:root` and `.dark` instead.
  The only deliberate exceptions are brand marks in `components/icons.tsx`.
- `app/layout.tsx` runs a small inline script before paint that applies `.dark` unless
  `localStorage["marketcap.theme"] === "light"`, so dark is the default and there is no flash.
- `lib/theme.ts` is the external store behind `useTheme`/`applyTheme`/`toggleTheme`; the server
  snapshot is `"dark"` to match the default.

## 7. Error handling philosophy

- Provider failure never renders invented data. Either the last real value (within the stale window)
  or an explicit empty state is shown.
- Routes return `available: false` / `source: "unconfigured"` rather than non-200s for expected
  conditions, so the client renders a message instead of an error boundary.
- No global error boundary yet; the app has no crash-prone server work outside these routes.

## 8. Extension points

- **New screen:** add `app/<route>/page.tsx`, wrap in `<AppShell>`, add the nav entry in
  `sidebar.tsx` and `mobile-nav.tsx`.
- **New provider:** add a route under `app/api/*` that normalises to the shapes above; the client
  hooks only depend on `{ quotes }` / `{ candles }`.
- **Auth later:** replace `useLocalStore` with server actions/queries keyed by `auth.uid()`, keeping
  the same `Position` / ticker-array shapes so components do not change.
