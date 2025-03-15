import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface FormatNumberOptions extends Intl.NumberFormatOptions {
  locale?: string;
}

export function formatNumber(
  value: number,
  options: FormatNumberOptions = {}
): string {
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
  }).format(value);
}

export function formatCryptoAmount(amount: number | string, decimals: number = 8): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(amount: number | string, currency: string = 'NGN'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return currency === 'NGN' ? '₦0.00' : '$0.00';

  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const formatted = formatter.format(num);
  
  // For NGN, replace NGN with ₦ and ensure space after symbol
  if (currency === 'NGN') {
    return formatted.replace('NGN', '₦').trim();
  }
  
  return formatted;
}

export function formatCompactNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';

  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 2
  }).format(n);
}

export function formatMarketCap(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function formatNairaAmount(amount: number | string): string {
  return formatCurrency(amount, 'NGN');
}