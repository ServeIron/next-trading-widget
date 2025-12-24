/**
 * Trading Feature - Public API
 * 
 * This is the ONLY public interface for the trading module.
 * All internal implementation details are hidden.
 * 
 * Usage:
 * ```tsx
 * import { TradingChartModule } from './features/trading';
 * 
 * <TradingChartModule
 *   config={{
 *     api: {
 *       apiBaseUrl: 'https://api.binance.com/api/v3',
 *       wsBaseUrl: 'wss://stream.binance.com:9443/ws',
 *     },
 *   }}
 * />
 * ```
 */

// Main Public Component
export { TradingChartModule } from './components/TradingChartModule';
export type { TradingChartModuleProps } from './components/TradingChartModule';

// Configuration Types (needed for props)
export type { TradingModuleConfig, TradingApiConfig } from './types/config';

// Data Types (needed for advanced usage)
export type { KlineInterval, BinanceKline } from './types/binance';
export type { HorizontalLineConfig } from './types/lines';
export type { IndicatorConfigUnion } from './types/indicators';

