export type SupportedCurrency = 'BTC' | 'ETH' | 'USDT' | 'USDC';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  kyc_verified: boolean;
  kyc_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface P2POrder {
  id: string;
  creator_id: string;
  type: 'buy' | 'sell';
  currency: SupportedCurrency;
  price: string;
  amount: string;
  min_order: string;
  max_order: string;
  payment_methods: string[];
  terms: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  creator?: {
    name: string;
    completed_trades: number;
    completion_rate: number;
  };
} 