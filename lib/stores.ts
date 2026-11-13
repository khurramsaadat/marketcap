export type Position = {
  id: string;
  ticker: string;
  quantity: number;
  costBasis: number;
  purchaseDate: string;
  targetPrice: number | null;
};

export const PORTFOLIO_KEY = "marketcap.portfolio";
export const WATCHLIST_KEY = "marketcap.watchlist";

/**
 * Empty by design: positions and watchlist entries are user data, not seed data.
 * They are stored in this browser until Supabase auth is connected.
 */
export const seedPositions: Position[] = [];

/** A few tickers pre-selected only so the watchlist is discoverable on first run. */
export const seedWatchlist: string[] = ["AAPL", "MSFT", "NVDA"];
