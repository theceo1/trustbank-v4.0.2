import { Icons } from "@/components/ui/icons";
import { Circle } from "lucide-react";

export const formatAmount = (amount: string, currency: string): string => {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0.00";
  
  const decimals = ['USD', 'NGN'].includes(currency.toUpperCase()) ? 2 : 8;
  return num.toFixed(decimals);
};

export const formatCurrencyDisplay = (currency: string): string => {
  const currencyMap: Record<string, string> = {
    USDT: 'USDT (Tether)',
    BTC: 'BTC (Bitcoin)',
    ETH: 'ETH (Ethereum)',
    SOL: 'SOL (Solana)',
    MATIC: 'MATIC (Polygon)',
    XRP: 'XRP (Ripple)',
    DOGE: 'DOGE (Dogecoin)',
    ADA: 'ADA (Cardano)',
    DOT: 'DOT (Polkadot)',
    LTC: 'LTC (Litecoin)',
    LINK: 'LINK (Chainlink)',
    BCH: 'BCH (Bitcoin Cash)',
    AAVE: 'AAVE (Aave)',
    ALGO: 'ALGO (Algorand)',
    NEAR: 'NEAR (NEAR Protocol)',
    FIL: 'FIL (Filecoin)',
    SAND: 'SAND (The Sandbox)',
    MANA: 'MANA (Decentraland)',
    APE: 'APE (ApeCoin)',
    SHIB: 'SHIB (Shiba Inu)',
    SUI: 'SUI (Sui)',
    INJ: 'INJ (Injective)',
    ARB: 'ARB (Arbitrum)',
    TON: 'TON (Toncoin)',
    RNDR: 'RNDR (Render Token)',
    STX: 'STX (Stacks)',
    GRT: 'GRT (The Graph)'
  };
  return currencyMap[currency] || currency;
};

import React from "react";

export const getCurrencyIcon = (currency: string): JSX.Element => {
  let Icon: React.ComponentType<{ className?: string }>;
  switch (currency.toUpperCase()) {
    case 'BTC':
      Icon = Icons.bitcoin;
      break;
    case 'ETH':
      Icon = Icons.ethereum;
      break;
    case 'USDT':
      Icon = Icons.dollar;
      break;
    case 'NGN':
      Icon = Icons.naira;
      break;
    case 'USD':
      Icon = Icons.dollar;
      break;
    default:
      Icon = Circle;
  }
  return <Icon className="h-4 w-4" />;
};

export const getCurrencyName = (currency: string): string => {
  const names: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    USDT: 'Tether',
    XRP: 'Ripple',
    DOGE: 'Dogecoin',
    ADA: 'Cardano',
    DOT: 'Polkadot',
    LTC: 'Litecoin',
    LINK: 'Chainlink',
    BCH: 'Bitcoin Cash',
    NGN: 'Nigerian Naira'
  };
  return names[currency.toUpperCase()] || currency.toUpperCase();
};

export const calculateNGNEquivalent = (
  amount: string, 
  currency: string, 
  wallets: Array<{ currency: string; balance: string; estimated_value?: number; }>
): number => {
  if (!amount || !currency) return 0;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return 0;
  
  if (currency === 'NGN') return numAmount;

  const marketData = wallets.find(w => w.currency === currency);
  if (!marketData?.estimated_value) return 0;

  const rate = marketData.estimated_value / parseFloat(marketData.balance);
  return numAmount * rate;
}; 