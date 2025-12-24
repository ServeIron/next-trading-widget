/**
 * Trading Module Configuration Types
 * Used for dependency injection to make the module plug-and-play
 */

export interface TradingApiConfig {
  /**
   * Base URL for REST API
   * Example: 'https://api.binance.com/api/v3'
   */
  apiBaseUrl: string;

  /**
   * Base URL for WebSocket connections
   * Example: 'wss://stream.binance.com:9443/ws'
   */
  wsBaseUrl: string;
}

export interface TradingModuleConfig {
  /**
   * API configuration for data fetching
   */
  api: TradingApiConfig;

  /**
   * Default symbol to display
   * @default 'BTCUSDT'
   */
  defaultSymbol?: string;

  /**
   * Default interval to display
   * @default '1d'
   */
  defaultInterval?: string;

  /**
   * Default chart height in pixels
   * @default 600
   */
  defaultHeight?: number;

  /**
   * Header height for layout calculations
   * @default 60
   */
  headerHeight?: number;
}

