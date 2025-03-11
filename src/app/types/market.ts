export interface MarketOverview {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
}

export interface MarketData {
  currency: string;
  price: number;
  change_24h: number;
  volume: string;
  high_24h: string;
  low_24h: string;
}

export interface MarketTicker {
  last: string;
  high: string;
  low: string;
  volume: string;
  change: string;
  price_change_percent: string;
} 