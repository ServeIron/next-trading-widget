/**
 * Binance API Service
 * Handles all Binance API interactions
 */

import type {
  BinanceKline,
  BinanceKlineRaw,
  BinanceKlineWebSocket,
  KlineInterval,
} from '../types/binance';
import type { TradingApiConfig } from '../types/config';

// Default config (can be overridden via dependency injection)
const DEFAULT_API_CONFIG: TradingApiConfig = {
  apiBaseUrl: 'https://api.binance.com/api/v3',
  wsBaseUrl: 'wss://stream.binance.com:9443/ws',
};

// Global config instance (set via setApiConfig)
let apiConfig: TradingApiConfig = DEFAULT_API_CONFIG;

/**
 * Set API configuration (dependency injection)
 * Should be called before using any service functions
 */
export function setApiConfig(config: TradingApiConfig): void {
  apiConfig = config;
}

/**
 * Get current API configuration
 */
export function getApiConfig(): TradingApiConfig {
  return apiConfig;
}

/**
 * Convert Binance raw kline data to our format
 */
function transformKline(raw: BinanceKlineRaw): BinanceKline {
  return {
    time: Math.floor(raw[0] / 1000), // Convert ms to seconds
    open: parseFloat(raw[1]),
    high: parseFloat(raw[2]),
    low: parseFloat(raw[3]),
    close: parseFloat(raw[4]),
    volume: parseFloat(raw[5]),
  };
}

/**
 * Fetch historical kline data from Binance REST API
 */
export async function fetchKlines(
  symbol: string,
  interval: KlineInterval,
  limit: number = 500,
  signal?: AbortSignal
): Promise<BinanceKline[]> {
  try {
    const url = new URL(`${apiConfig.apiBaseUrl}/klines`);
    url.searchParams.set('symbol', symbol.toUpperCase());
    url.searchParams.set('interval', interval);
    url.searchParams.set('limit', limit.toString());

    const response = await fetch(url.toString(), { signal });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          code: response.status,
          msg: response.statusText,
        };
      }
      
      const errorMessage = errorData.msg || errorData.message || response.statusText;
      throw new Error(`Binance API Error: ${errorMessage} (Code: ${errorData.code || response.status})`);
    }

    const data: BinanceKlineRaw[] = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No data received from Binance API');
    }

    return data.map(transformKline);
  } catch (error) {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Could not connect to Binance API. Check your internet connection.');
    }
    
    // CORS errors
    if (error instanceof TypeError && error.message.includes('CORS')) {
      throw new Error('CORS error: Binance API blocked the request. This might be a browser security issue.');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to fetch kline data from Binance');
  }
}

/**
 * Create WebSocket connection for real-time kline updates
 */
export function createKlineWebSocket(
  symbol: string,
  interval: KlineInterval,
  onMessage: (kline: BinanceKline) => void,
  onError?: (error: Event) => void
): WebSocket {
  const stream = `${symbol.toLowerCase()}@kline_${interval}`;
  const wsUrl = `${apiConfig.wsBaseUrl}/${stream}`;
  
  let ws: WebSocket;
  
  try {
    ws = new WebSocket(wsUrl);
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    throw new Error('Failed to create WebSocket connection');
  }

  ws.onopen = () => {
    // WebSocket bağlantısı başarıyla kuruldu
    console.log('WebSocket connected:', stream);
  };

  ws.onmessage = (event) => {
    try {
      const data: BinanceKlineWebSocket = JSON.parse(event.data);
      
      // Process both open and closed candles for real-time updates
      if (data.k) {
        const kline: BinanceKline = {
          time: Math.floor(data.k.t / 1000), // Convert ms to seconds
          open: parseFloat(data.k.o),
          high: parseFloat(data.k.h),
          low: parseFloat(data.k.l),
          close: parseFloat(data.k.c),
          volume: parseFloat(data.k.v),
        };
        onMessage(kline);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    // WebSocket error event doesn't provide detailed error info
    // Check connection state instead
    const readyStateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
    const stateName = readyStateNames[ws.readyState] || 'UNKNOWN';
    
    // WebSocket hataları genellikle kritik değildir (sadece real-time updates için)
    // Bu yüzden sadece uyarı olarak loglayalım
    console.warn('WebSocket connection issue (non-critical):', {
      stream,
      state: stateName,
      readyState: ws.readyState,
      url: wsUrl,
    });
    
    onError?.(error);
  };

  ws.onclose = (event) => {
    // Only log if it wasn't a clean close
    if (!event.wasClean) {
      console.warn('WebSocket closed unexpectedly:', {
        stream,
        code: event.code,
        reason: event.reason || 'No reason provided',
        wasClean: event.wasClean,
      });
    } else {
      // Clean close - normal durum
      console.log('WebSocket closed cleanly:', stream);
    }
  };

  return ws;
}

/**
 * Validate symbol format (e.g., BTCUSDT)
 */
export function validateSymbol(symbol: string): boolean {
  return /^[A-Z]{2,10}USDT$/.test(symbol.toUpperCase());
}

