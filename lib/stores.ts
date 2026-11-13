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
 * Default portfolio for a first visit: one share of four large caps.
 *
 * These are example positions, not market data — the prices on screen always
 * come from the live quote routes. `costBasis` is the reference price recorded
 * on 2026-11-13, so gain/loss shows the real move since then. A visitor who
 * already has `marketcap.portfolio` stored keeps their own rows.
 */
export const seedPositions: Position[] = [
  {
    id: "seed-aapl",
    ticker: "AAPL",
    quantity: 1,
    costBasis: 354.88,
    purchaseDate: "2026-11-13",
    targetPrice: null,
  },
  {
    id: "seed-msft",
    ticker: "MSFT",
    quantity: 1,
    costBasis: 523,
    purchaseDate: "2026-11-13",
    targetPrice: null,
  },
  {
    id: "seed-nvda",
    ticker: "NVDA",
    quantity: 1,
    costBasis: 166.19,
    purchaseDate: "2026-11-13",
    targetPrice: null,
  },
  {
    id: "seed-amzn",
    ticker: "AMZN",
    quantity: 1,
    costBasis: 267.44,
    purchaseDate: "2026-11-13",
    targetPrice: null,
  },
];

/** Same four symbols so the watchlist and portfolio agree on a first visit. */
export const seedWatchlist: string[] = ["AAPL", "MSFT", "NVDA", "AMZN"];
