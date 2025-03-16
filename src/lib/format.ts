import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Type Definitions
export type NumericValue = number | string;

export interface FormatOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;
}

export interface RateFormatOptions {
  inputCurrency: string;
  outputCurrency: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

// Utility function to merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Core formatting function
function formatNumericValue(value: NumericValue, options: FormatOptions = {}): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0';

  const {
    locale = 'en-US',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    style = 'decimal',
    currency,
  } = options;

  return new Intl.NumberFormat(locale, {
    style,
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
    ...options,
  }).format(numValue);
}

// Specialized formatting functions
export function formatCurrency(value: NumericValue, currency: string = 'NGN'): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0';

  // Handle crypto currencies differently since they're not valid ISO currency codes
  if (['BTC', 'ETH', 'USDT'].includes(currency)) {
    return `${formatNumericValue(numValue, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    })} ${currency}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

export function formatCryptoAmount(value: NumericValue, decimals: number = 8): string {
  return formatNumericValue(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

export function formatRate(value: NumericValue, options: RateFormatOptions): string {
  const isCrypto = options.inputCurrency !== 'NGN' && options.inputCurrency !== 'USD';
  const decimals = isCrypto ? 8 : 2;

  return formatNumericValue(value, {
    minimumFractionDigits: options.minimumFractionDigits ?? decimals,
    maximumFractionDigits: options.maximumFractionDigits ?? decimals,
  });
}

export function formatPercentage(value: NumericValue): string {
  return formatNumericValue(value, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCompactNumber(value: NumericValue): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0';

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

export function formatMarketCap(value: NumericValue): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '$0';

  if (numValue >= 1e12) {
    return `$${(numValue / 1e12).toFixed(2)}T`;
  } else if (numValue >= 1e9) {
    return `$${(numValue / 1e9).toFixed(2)}B`;
  } else if (numValue >= 1e6) {
    return `$${(numValue / 1e6).toFixed(2)}M`;
  } else {
    return formatCurrency(numValue, 'USD');
  }
}

// Helper functions for trade calculations
export function parseNumericInput(value: string): number {
  const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

export function validateNumericInput(value: string, options: {
  min?: number;
  max?: number;
  decimals?: number;
} = {}): string | null {
  const { min = 0, max, decimals = 8 } = options;
  const numValue = parseNumericInput(value);

  if (numValue < min) {
    return `Value must be at least ${formatNumericValue(min)}`;
  }
  if (max !== undefined && numValue > max) {
    return `Value cannot exceed ${formatNumericValue(max)}`;
  }
  
  const decimalPlaces = value.includes('.') ? value.split('.')[1].length : 0;
  if (decimalPlaces > decimals) {
    return `Maximum ${decimals} decimal places allowed`;
  }

  return null;
} 