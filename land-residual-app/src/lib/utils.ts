import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number as currency
export function formatCurrency(
  value: number,
  options: { decimals?: number; compact?: boolean; showSign?: boolean } = {}
): string {
  const { decimals = 0, compact = false, showSign = false } = options;

  if (compact && Math.abs(value) >= 1000000) {
    const millions = value / 1000000;
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}$${millions.toFixed(2)}M`;
  }

  if (compact && Math.abs(value) >= 1000) {
    const thousands = value / 1000;
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}$${thousands.toFixed(0)}K`;
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const formatted = formatter.format(value);
  if (showSign && value > 0) {
    return '+' + formatted;
  }
  return formatted;
}

// Format number with commas
export function formatNumber(
  value: number,
  options: { decimals?: number; suffix?: string } = {}
): string {
  const { decimals = 0, suffix = '' } = options;

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(value) + suffix;
}

// Format as percentage
export function formatPercent(
  value: number,
  options: { decimals?: number; multiply?: boolean } = {}
): string {
  const { decimals = 1, multiply = true } = options;
  const pctValue = multiply ? value * 100 : value;
  return `${pctValue.toFixed(decimals)}%`;
}

// Parse currency string to number
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

// Parse percentage string to decimal
export function parsePercent(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return (parseFloat(cleaned) || 0) / 100;
}

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Format date
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Local storage helpers with SSR safety
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Error saving to localStorage');
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    console.error('Error removing from localStorage');
  }
}
