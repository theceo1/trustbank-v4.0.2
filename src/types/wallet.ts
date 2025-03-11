import { Icons } from "@/components/ui/icons";

export interface Wallet {
  id: string;
  currency: string;
  balance: string;
  address: string | null;
  icon: keyof typeof Icons;
}

export interface MarketData {
  currency: string;
  price: number;
  change_24h: number;
} 