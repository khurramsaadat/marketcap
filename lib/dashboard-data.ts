export type StockHolding = {
  ticker: string;
  name: string;
  value: number;
  changePct: number;
};

export const holdings: StockHolding[] = [
  { ticker: "AAPL", name: "Apple Inc", value: 15238, changePct: 5.9 },
  { ticker: "GOOGL", name: "Google Corp", value: 6842, changePct: 5.9 },
  { ticker: "SPOT", name: "Spotify Technology SA", value: 12238, changePct: -5.9 },
  { ticker: "TWTR", name: "Twitter Inc", value: 5420, changePct: 2.4 },
];

export const portfolioSummary = {
  total: 17580,
  changePct: 5.9,
  profit: 4790,
};

export type StockRow = {
  ticker: string;
  name: string;
  investDate: string;
  volume: string;
  changePct: number;
  price: number;
};

export const stockRows: StockRow[] = [
  {
    ticker: "AAPL",
    name: "Apple Inc",
    investDate: "Feb 22, 2024",
    volume: "7.10B",
    changePct: 5.9,
    price: 193.0,
  },
  {
    ticker: "TWTR",
    name: "Twitter Inc",
    investDate: "Feb 17, 2024",
    volume: "2.10B",
    changePct: -2.9,
    price: 23.3,
  },
  {
    ticker: "GOOGL",
    name: "Google Corp",
    investDate: "Jan 09, 2024",
    volume: "5.42B",
    changePct: 3.4,
    price: 142.65,
  },
  {
    ticker: "SPOT",
    name: "Spotify Technology SA",
    investDate: "Dec 28, 2023",
    volume: "1.86B",
    changePct: -1.2,
    price: 238.4,
  },
];

/** Two samples per day gives the soft wave shape used in the statistics card. */
export const chartSeries = [
  18000, 21500, 20500, 23000, 26000, 24500, 27000, 29000, 27500, 30000,
  28000, 25500, 33000,
];

export const chartDays = ["Dec 2", "Dec 3", "Dec 4", "Dec 5", "Dec 6", "Dec 7", "Dec 8"];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
