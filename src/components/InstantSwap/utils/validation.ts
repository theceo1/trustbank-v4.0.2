import { TRADE_LIMITS } from '../constants';
import { AmountCurrencyType } from '../types';

export const validateAmount = (
  value: string,
  amountCurrency: AmountCurrencyType,
  fromCurrency: string
): string | null => {
  const numValue = Number(value);
  
  if (amountCurrency === 'NGN') {
    if (numValue < TRADE_LIMITS.MIN_NGN) {
      return `Minimum amount is ₦${TRADE_LIMITS.MIN_NGN.toLocaleString()}`;
    }
    if (numValue > TRADE_LIMITS.MAX_NGN) {
      return `Maximum amount is ₦${TRADE_LIMITS.MAX_NGN.toLocaleString()}`;
    }
  } else if (amountCurrency === 'CRYPTO') {
    const minCrypto = TRADE_LIMITS.MIN_CRYPTO[fromCurrency as keyof typeof TRADE_LIMITS.MIN_CRYPTO];
    if (minCrypto && numValue < minCrypto) {
      return `Minimum amount is ${minCrypto} ${fromCurrency}`;
    }
    const maxCrypto = TRADE_LIMITS.MAX_CRYPTO[fromCurrency as keyof typeof TRADE_LIMITS.MAX_CRYPTO];
    if (maxCrypto && numValue > maxCrypto) {
      return `Maximum amount is ${maxCrypto} ${fromCurrency}`;
    }
  }
  
  return null;
};

export const validateSwapForm = (
  fromCurrency: string,
  toCurrency: string,
  amount: string
): string | null => {
  if (!fromCurrency) {
    return 'Please select a source currency';
  }
  
  if (!toCurrency) {
    return 'Please select a destination currency';
  }
  
  if (!amount || parseFloat(amount) <= 0) {
    return 'Please enter a valid amount';
  }
  
  return null;
}; 