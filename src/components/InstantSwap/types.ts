export interface WalletType {
  id: string;
  currency: string;
  balance: string;
  estimated_value?: number;
}

export interface TradeDetails {
  type: string;
  amount: string;
  currency: string;
  rate: number;
  fees: {
    total: number;
    platform: number;
    service: number;
  };
  total: number;
  quote_amount: string;
  ngn_equivalent: number;
}

export interface CurrencyPair {
  value: string;
  label: string;
  icon: JSX.Element;
}

export interface Currency {
  value: string;
  label: string;
}

export interface QuoteState {
  id: string;
  rate: number;
  fee: number;
  network_fee: number;
  total: number;
  quote_amount: string;
}

export type AmountCurrencyType = 'CRYPTO' | 'NGN' | 'USD';

export interface SwapFormData {
  fromCurrency: string;
  toCurrency: string;
  amount: string;
  amountCurrency: AmountCurrencyType;
}

export interface FeeConfig {
  user_tier: {
    fee_percentage: number;
  };
}

export interface InstantSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet?: WalletType;
}

export interface TradePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  trade: TradeDetails;
  countdown: number;
} 