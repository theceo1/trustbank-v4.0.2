import { KYCTier } from './kyc';

export interface VolumeTier {
  min_volume: number;
  max_volume: number | null;
  fee_percentage: number;
}

export interface NetworkFees {
  BTC: number;
  ETH: number;
  USDT: number;
}

export interface FeeTiers {
  base_fee: number;
  volume_tiers: VolumeTier[];
  network_fees: NetworkFees;
}

export interface KYCTierConfig {
  name: string;
  requirements: string[];
  daily_limit: number;
  monthly_limit: number;
  withdrawal_limit: number;
}

export type KYCTiersConfig = Record<KYCTier, KYCTierConfig>;

export interface DojahConfig {
  app_id: string;
  api_key: string;
  test_mode: boolean;
  webhook_url: string;
  webhook_secret: string;
}

export interface Configuration {
  id: string;
  key: string;
  value: FeeTiers | KYCTiersConfig | DojahConfig;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ConfigurationResponse {
  status: 'success' | 'error';
  data?: Configuration[];
  error?: string;
}

export interface UpdateConfigurationRequest {
  configs: Partial<Configuration>[];
} 