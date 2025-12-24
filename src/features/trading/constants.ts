/**
 * Trading/Chart Constants
 * Chart-specific constants for colors, styles, and configuration
 */

// Chart Colors
export const CHART_COLORS = {
  background: '#171B26',
  text: 'rgba(255, 255, 255, 0.9)',
  grid: '#334158',
  candleUp: '#4bffb5',
  candleDown: '#ff4976',
  crosshair: 'rgba(255, 255, 255, 0.2)',
  volumeUp: 'rgba(75, 255, 181, 0.3)', // Semi-transparent green for volume up
  volumeDown: 'rgba(255, 73, 118, 0.3)', // Semi-transparent red for volume down
} as const;

// Preset Colors for Horizontal Lines
export const PRESET_LINE_COLORS = [
  '#4bffb5',
  '#ff4976',
  '#ff9800',
  '#2196f3',
  '#9c27b0',
  '#00bcd4',
  '#f44336',
  '#e91e63',
] as const;

// Chart Configuration
export const CHART_CONFIG = {
  defaultHeight: 400,
  defaultLimit: 500,
  requestTimeout: 10000, // 10 seconds - reduced for better UX
  crosshairLabelOffset: 60,
  crosshairLabelTopOffset: 10,
  initialVisibleBars: 150, // Number of bars to show initially (zoomed in view)
} as const;

// Popular Trading Symbols
export const POPULAR_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'ADAUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'DOTUSDT',
  'MATICUSDT',
  'AVAXUSDT',
] as const;

// Indicator Default Colors
export const INDICATOR_DEFAULT_COLOR = '#ff9800';

// Line Styles
export const LINE_STYLES = {
  solid: 0,
  dashed: 1,
  dotted: 2,
} as const;

// Interval-based maximum bar limits
// Binance API maximum limit is 1000, but we optimize based on interval
export const INTERVAL_MAX_LIMITS: Record<string, number> = {
  '1m': 1000,   // 1 minute - max 1000 bars (~16.6 hours)
  '3m': 1000,   // 3 minutes - max 1000 bars (~50 hours)
  '5m': 1000,   // 5 minutes - max 1000 bars (~83 hours)
  '15m': 1000,  // 15 minutes - max 1000 bars (~10.4 days)
  '30m': 1000,  // 30 minutes - max 1000 bars (~20.8 days)
  '1h': 1000,   // 1 hour - max 1000 bars (~41.6 days)
  '2h': 1000,   // 2 hours - max 1000 bars (~83 days)
  '4h': 1000,   // 4 hours - max 1000 bars (~166 days)
  '6h': 1000,   // 6 hours - max 1000 bars (~250 days)
  '8h': 1000,   // 8 hours - max 1000 bars (~333 days)
  '12h': 1000,  // 12 hours - max 1000 bars (~500 days)
  '1d': 1000,   // 1 day - max 1000 bars (~2.7 years)
  '3d': 1000,   // 3 days - max 1000 bars (~8.2 years)
  '1w': 1000,   // 1 week - max 1000 bars (~19.2 years)
  '1M': 1000,   // 1 month - max 1000 bars (~83 years)
} as const;

/**
 * Get maximum bar limit for a given interval
 * @param interval - Kline interval
 * @returns Maximum number of bars to fetch
 */
export function getMaxLimitForInterval(interval: string): number {
  return INTERVAL_MAX_LIMITS[interval] || CHART_CONFIG.defaultLimit;
}

