import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface NumberFormatOptions extends Intl.NumberFormatOptions {
  locale?: string;
}

/**
 * Formats a number with specified options
 */
export function formatNumber(
  value: number | string,
  options: NumberFormatOptions = {}
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0';

  const {
    locale = 'en-US',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    ...rest
  } = options;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    ...rest,
  }).format(numValue);
}

export function formatAmount(amount: number, currency: string) {
  if (typeof amount !== 'number') return '0.00';
  
  try {
    // For NGN, always use 2 decimal places
    if (currency === 'NGN') {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    }
    
    // For cryptocurrencies, always show up to 8 decimal places
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount) + ' ' + currency.toUpperCase();
  } catch (error) {
    console.error('Error formatting amount:', error);
    return '0.00';
  }
}

/**
 * Formats a crypto amount with 8 decimal places
 */
export function formatCryptoAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00000000';
  return num.toFixed(8);
}

/**
 * Formats a currency amount with symbol
 */
export function formatCurrency(
  value: number | string,
  currency: string = 'USD',
  options: Intl.NumberFormatOptions = {}
): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(numericValue);
}

export function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

export function formatCompactNumber(value: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(value);
}

export const formatNairaAmount = (amount: number): string => {
  if (isNaN(amount)) return '0.00';
  return amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Formats a rate with appropriate decimals
 */
export function formatRate(
  value: number | string,
  options: {
    inputCurrency: string;
    outputCurrency: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0';

  const isCrypto = options.inputCurrency !== 'NGN' && options.inputCurrency !== 'USD';
  const decimals = isCrypto ? 8 : 2;

  return formatNumber(numValue, {
    minimumFractionDigits: options.minimumFractionDigits ?? decimals,
    maximumFractionDigits: options.maximumFractionDigits ?? decimals,
  });
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}