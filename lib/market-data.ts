export type Quote = {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  marketCap: string;
  pe: number;
  dayLow: number;
  dayHigh: number;
  yearLow: number;
  yearHigh: number;
  sector: string;
  about: string;
};

export const quotes: Quote[] = [
  {
    ticker: "AAPL",
    name: "Apple Inc",
    price: 193.0,
    changePct: 5.9,
    marketCap: "2.98T",
    pe: 29.4,
    dayLow: 190.12,
    dayHigh: 194.76,
    yearLow: 164.08,
    yearHigh: 199.62,
    sector: "Consumer Electronics",
    about:
      "Designs and sells smartphones, personal computers, tablets, wearables and accessories, alongside a growing services business.",
  },
  {
    ticker: "GOOGL",
    name: "Google Corp",
    price: 142.65,
    changePct: 5.9,
    marketCap: "1.79T",
    pe: 25.1,
    dayLow: 140.02,
    dayHigh: 143.9,
    yearLow: 115.35,
    yearHigh: 155.2,
    sector: "Interactive Media",
    about:
      "Operates search, advertising, cloud infrastructure and consumer platforms including YouTube, Android and Workspace.",
  },
  {
    ticker: "SPOT",
    name: "Spotify Technology SA",
    price: 238.4,
    changePct: -5.9,
    marketCap: "47.2B",
    pe: 62.8,
    dayLow: 236.1,
    dayHigh: 246.3,
    yearLow: 138.6,
    yearHigh: 268.4,
    sector: "Digital Audio",
    about:
      "Streams music, podcasts and audiobooks to listeners worldwide, monetised through subscriptions and advertising.",
  },
  {
    ticker: "TWTR",
    name: "Twitter Inc",
    price: 23.3,
    changePct: 2.4,
    marketCap: "17.8B",
    pe: 31.2,
    dayLow: 22.94,
    dayHigh: 23.68,
    yearLow: 18.4,
    yearHigh: 29.1,
    sector: "Social Media",
    about:
      "Real-time social platform for short posts, live commentary and public conversation across news and entertainment.",
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corp",
    price: 415.2,
    changePct: 1.8,
    marketCap: "3.09T",
    pe: 34.6,
    dayLow: 411.5,
    dayHigh: 418.9,
    yearLow: 309.4,
    yearHigh: 430.8,
    sector: "Software Infrastructure",
    about:
      "Builds cloud, productivity and operating-system software, including Azure, Microsoft 365 and Windows.",
  },
  {
    ticker: "NVDA",
    name: "NVIDIA Corp",
    price: 121.4,
    changePct: 3.6,
    marketCap: "2.99T",
    pe: 57.3,
    dayLow: 118.2,
    dayHigh: 123.1,
    yearLow: 66.2,
    yearHigh: 140.7,
    sector: "Semiconductors",
    about:
      "Designs accelerated-computing GPUs and networking systems used for AI training, inference and visualisation workloads.",
  },
  {
    ticker: "TSLA",
    name: "Tesla Inc",
    price: 248.5,
    changePct: -2.1,
    marketCap: "791.4B",
    pe: 61.9,
    dayLow: 245.3,
    dayHigh: 256.2,
    yearLow: 138.8,
    yearHigh: 299.3,
    sector: "Electric Vehicles",
    about:
      "Manufactures electric vehicles, battery storage and solar products, with an expanding energy and autonomy software business.",
  },
  {
    ticker: "AMZN",
    name: "Amazon.com Inc",
    price: 178.35,
    changePct: 0.9,
    marketCap: "1.86T",
    pe: 41.7,
    dayLow: 176.2,
    dayHigh: 180.1,
    yearLow: 118.4,
    yearHigh: 191.7,
    sector: "E-Commerce",
    about:
      "Operates global online retail, logistics and Amazon Web Services cloud infrastructure for businesses worldwide.",
  },
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

/** Deterministic pseudo-history so charts look alive without an API. */
export function priceHistory(quote: Quote, points = 26) {
  const seed = quote.ticker.charCodeAt(0) + quote.ticker.charCodeAt(1);
  return Array.from({ length: points }, (_, i) => {
    const drift = (i / (points - 1) - 0.5) * 0.05;
    const wave =
      Math.sin((i + seed) / 2.6) * 0.014 + Math.cos((i + seed) / 5.4) * 0.009;
    return Number((quote.price * (1 + drift + wave)).toFixed(2));
  });
}

export type NewsItem = {
  title: string;
  source: string;
  date: string;
  summary: string;
};

export function newsFor(quote: Quote): NewsItem[] {
  return [
    {
      title: `${quote.name} shares ${quote.changePct >= 0 ? "climb" : "slide"} as investors weigh demand outlook`,
      source: "MarketCap Wire",
      date: "2h ago",
      summary: `Analysts point to shifting order books in ${quote.sector.toLowerCase()} as the main driver behind the move.`,
    },
    {
      title: `What the latest quarter says about ${quote.ticker}'s margins`,
      source: "The Closing Bell",
      date: "5h ago",
      summary: `A closer look at operating leverage, guidance and how the street is modelling the next twelve months.`,
    },
    {
      title: `${quote.sector} sector update: three names to watch this week`,
      source: "MarketCap Research",
      date: "1d ago",
      summary: `Screening for cash-flow stability and balance-sheet strength across the sector.`,
    },
  ];
}

export function marketNews(): NewsItem[] {
  return [
    {
      title: "Indexes edge higher as rate-cut expectations firm up",
      source: "MarketCap Wire",
      date: "1h ago",
      summary: "Traders are pricing in a softer policy path after this week's inflation print.",
    },
    {
      title: "Semiconductor earnings put AI capex back in focus",
      source: "The Closing Bell",
      date: "4h ago",
      summary: "Guidance from the largest chipmakers is setting the tone for the quarter.",
    },
    {
      title: "Energy slips while consumer discretionary leads the tape",
      source: "MarketCap Research",
      date: "7h ago",
      summary: "Sector rotation continues as investors rotate toward domestic demand names.",
    },
  ];
}
