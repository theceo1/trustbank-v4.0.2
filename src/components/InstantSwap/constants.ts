import { Currency } from './types';

export const SUPPORTED_CURRENCIES: Currency[] = [
  { value: 'NGN', label: 'Nigerian Naira' },
  { value: 'BTC', label: 'Bitcoin' },
  { value: 'ETH', label: 'Ethereum' },
  { value: 'USDT', label: 'Tether' },
  { value: 'USDC', label: 'USD Coin' },
  { value: 'BNB', label: 'Binance Coin' },
  { value: 'SOL', label: 'Solana' },
  { value: 'MATIC', label: 'Polygon' },
  { value: 'XRP', label: 'Ripple' },
  { value: 'DOGE', label: 'Dogecoin' },
  { value: 'ADA', label: 'Cardano' },
  { value: 'DOT', label: 'Polkadot' },
  { value: 'LTC', label: 'Litecoin' },
  { value: 'LINK', label: 'Chainlink' },
  { value: 'BCH', label: 'Bitcoin Cash' },
  { value: 'AAVE', label: 'Aave' },
  { value: 'ALGO', label: 'Algorand' },
  { value: 'NEAR', label: 'NEAR Protocol' },
  { value: 'FIL', label: 'Filecoin' },
  { value: 'SAND', label: 'The Sandbox' },
  { value: 'MANA', label: 'Decentraland' },
  { value: 'APE', label: 'ApeCoin' },
  { value: 'SHIB', label: 'Shiba Inu' },
  { value: 'SUI', label: 'Sui' },
  { value: 'INJ', label: 'Injective' },
  { value: 'ARB', label: 'Arbitrum' },
  { value: 'TON', label: 'Toncoin' },
  { value: 'RNDR', label: 'Render Token' },
  { value: 'STX', label: 'Stacks' },
  { value: 'GRT', label: 'The Graph' }
];

export const TRADE_LIMITS = {
  MIN_NGN: 1000, // Minimum 1,000 NGN
  MAX_NGN: 10000000, // Maximum 10M NGN
  MIN_CRYPTO: {
    BTC: 0.0001,
    ETH: 0.01,
    USDT: 10,
    USDC: 10,
    DOGE: 100,
  },
  MAX_CRYPTO: {
    BTC: 100,
    ETH: 1000,
    USDT: 100000,
    USDC: 100000,
    DOGE: 1000000,
  }
};

export const QUOTE_COUNTDOWN_SECONDS = 14;
export const DEFAULT_USD_NGN_RATE = 1585.23; 