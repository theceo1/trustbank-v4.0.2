import { Icons } from "@/components/ui/icons";

export interface Wallet {
  id: string;
  currency: string;
  balance: string;
  address: string | null;
  icon: keyof typeof Icons;
  estimated_value?: number;
  market_price?: number;
}

export interface MarketData {
  currency: string;
  quote_currency: string;
  price: number;
  raw_price: number;
  change_24h: number;
} 