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

export const seedPositions: Position[] = [
  {
    id: "seed-aapl",
    ticker: "AAPL",
    quantity: 20,
    costBasis: 3200,
    purchaseDate: "2024-02-22",
    targetPrice: 210,
  },
  {
    id: "seed-googl",
    ticker: "GOOGL",
    quantity: 15,
    costBasis: 1850,
    purchaseDate: "2024-01-09",
    targetPrice: 165,
  },
  {
    id: "seed-spot",
    ticker: "SPOT",
    quantity: 8,
    costBasis: 2100,
    purchaseDate: "2023-12-28",
    targetPrice: null,
  },
];

export const seedWatchlist = ["AAPL", "NVDA", "MSFT"];
