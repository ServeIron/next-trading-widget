/**
 * OHLC (Open, High, Low, Close) Utility Functions
 */

import type { BinanceKline } from '../types/binance';
import type { HoveredBarData } from '../types/ohlc';

/**
 * Format price with appropriate decimal places
 * - Prices >= 1: 2 decimal places
 * - Prices < 1: 6 decimal places
 */
export function formatPrice(price: number): string {
  return price >= 1 ? price.toFixed(2) : price.toFixed(6);
}

/**
 * Determine if bar is positive (green) or negative (red)
 * - Positive: close >= open (green)
 * - Negative: close < open (red)
 */
export function isBarPositive(open: number, close: number): boolean {
  return close >= open;
}

/**
 * Get last bar data from Binance kline data array
 * Returns null if data array is empty
 */
export function getLastBarData(data: BinanceKline[]): HoveredBarData | null {
  if (data.length === 0) {
    return null;
  }

  const lastBar = data[data.length - 1];
  return {
    open: lastBar.open,
    high: lastBar.high,
    low: lastBar.low,
    close: lastBar.close,
    time: lastBar.time,
  };
}

