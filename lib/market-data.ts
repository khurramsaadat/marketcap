/**
 * Static ticker/name catalogue.
 *
 * This is the only non-live data in the app: it powers the ticker suggestions in
 * the watchlist and portfolio forms and gives a display name when a quote is
 * still loading. Prices, changes, profiles, metrics and news all come from
 * Finnhub at request time.
 */
export type Quote = {
  ticker: string;
  name: string;
};

export const quotes: Quote[] = [
  { ticker: "AAPL", name: "Apple Inc" },
  { ticker: "MSFT", name: "Microsoft Corp" },
  { ticker: "GOOGL", name: "Alphabet Inc" },
  { ticker: "AMZN", name: "Amazon.com Inc" },
  { ticker: "NVDA", name: "NVIDIA Corp" },
  { ticker: "META", name: "Meta Platforms Inc" },
  { ticker: "TSLA", name: "Tesla Inc" },
  { ticker: "SPOT", name: "Spotify Technology SA" },
  { ticker: "NFLX", name: "Netflix Inc" },
  { ticker: "JPM", name: "JPMorgan Chase & Co" },
];

export function findQuote(ticker: string) {
  return quotes.find((quote) => quote.ticker === ticker.toUpperCase());
}

export function searchQuotes(query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return quotes;
  return quotes.filter(
    (quote) =>
      quote.ticker.toLowerCase().includes(term) ||
      quote.name.toLowerCase().includes(term),
  );
}
