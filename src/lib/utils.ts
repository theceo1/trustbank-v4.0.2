import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string): string {
  // Handle crypto currencies
  if (['BTC', 'ETH', 'USDT', 'USDC'].includes(currency)) {
    return `${currency} ${amount.toFixed(currency === 'BTC' ? 8 : 6)}`;
  }

  // Handle fiat currencies
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  } catch (error) {
    // Fallback for unsupported currencies
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatNumber(value: number | string, options: {
  style?: 'decimal' | 'currency';
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
} = {}) {
  const {
    style = 'decimal',
    currency = 'NGN',
    minimumFractionDigits = 2,
    maximumFractionDigits = 8
  } = options;

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '0';

  const formatter = new Intl.NumberFormat('en-NG', {
    style,
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  const formatted = formatter.format(num);
  return style === 'currency' ? formatted.replace('NGN', '₦') : formatted;
}

export function formatCryptoAmount(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  
  // For very small numbers, use scientific notation
  if (num < 0.000001) {
    return num.toExponential(6);
  }
  
  // For regular numbers, use standard formatting
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  });
}

export function formatNairaAmount(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '₦ 0.00';
  
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num).replace('NGN', '₦');
}
