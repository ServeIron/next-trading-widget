/**
 * Custom hook for Binance data fetching
 * Follows modern React patterns with proper error handling and loading states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchKlines, createKlineWebSocket, validateSymbol } from '../services/binance';
import { CHART_CONFIG, getMaxLimitForInterval } from '../constants';
import type { BinanceKline, KlineInterval } from '../types/binance';

interface UseBinanceDataOptions {
  symbol: string;
  interval: KlineInterval;
  limit?: number;
  enableWebSocket?: boolean;
}

interface UseBinanceDataReturn {
  data: BinanceKline[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useBinanceData({
  symbol,
  interval,
  limit,
  enableWebSocket = true,
}: UseBinanceDataOptions): UseBinanceDataReturn {
  const [data, setData] = useState<BinanceKline[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const previousIntervalRef = useRef<KlineInterval | null>(null);

  // Calculate limit based on interval if not provided
  const calculatedLimit = limit ?? getMaxLimitForInterval(interval);

  const fetchData = useCallback(async (skipMountedCheck = false) => {
    if (!validateSymbol(symbol)) {
      const errorMsg = `Invalid symbol format: ${symbol}. Expected format: BTCUSDT`;
      console.error('Validation error:', errorMsg);
      setError(new Error(errorMsg));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Create AbortController for request cancellation
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    // Add timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      abortController.abort();
      if (skipMountedCheck || isMountedRef.current) {
        setError(new Error('Request timeout: The request took too long. Please check your internet connection.'));
        setLoading(false);
      }
    }, CHART_CONFIG.requestTimeout);

    try {
      const klines = await fetchKlines(symbol, interval, calculatedLimit, abortController.signal);
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (skipMountedCheck || isMountedRef.current) {
        setData(klines);
        setLoading(false);
        setError(null); // Clear any previous errors
      }
    } catch (err) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      console.error('Error fetching klines:', err);
      
      if (skipMountedCheck || isMountedRef.current) {
        // Check if it's an abort error
        if (err instanceof Error && err.name === 'AbortError') {
          setError(new Error('Request was cancelled or timed out. Please try again.'));
        } else {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          setError(new Error(errorMessage));
        }
        setLoading(false);
      }
    }
  }, [symbol, interval, calculatedLimit]);

  // Initial data fetch and interval change handling
  useEffect(() => {
    console.log('[useBinanceData] useEffect triggered', { symbol, interval, limit });
    
    // Clear data when interval changes
    if (previousIntervalRef.current !== null && previousIntervalRef.current !== interval) {
      setData([]);
      setError(null); // Clear previous errors when interval changes
    }
    previousIntervalRef.current = interval;
    
    // Create AbortController for request cancellation (outside performFetch so we can abort in cleanup)
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    let isCancelled = false;

    // Fetch data directly (don't use fetchData callback to avoid stale closure issues)
    const performFetch = async () => {
      console.log('[useBinanceData] performFetch started', { symbol, interval });
      if (!validateSymbol(symbol)) {
        const errorMsg = `Invalid symbol format: ${symbol}. Expected format: BTCUSDT`;
        console.error('Validation error:', errorMsg);
        setError(new Error(errorMsg));
        setLoading(false);
        return;
      }

      // Ensure loading state is set before fetch
      setLoading(true);
      setError(null);

      // Add timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        abortController.abort();
        if (!isCancelled) {
          setError(new Error('Request timeout: The request took too long. Please check your internet connection.'));
          setLoading(false);
        }
      }, CHART_CONFIG.requestTimeout);

      try {
        const currentLimit = limit ?? getMaxLimitForInterval(interval);
        console.log('[useBinanceData] Fetching klines...', { symbol, interval, currentLimit });
        const klines = await fetchKlines(symbol, interval, currentLimit, abortController.signal);
        console.log('[useBinanceData] Fetch successful, received', klines.length, 'klines');
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // Check if request was cancelled or aborted
        if (abortController.signal.aborted || isCancelled) {
          console.warn('[useBinanceData] Request was aborted or cancelled, skipping state update', { 
            aborted: abortController.signal.aborted, 
            cancelled: isCancelled 
          });
          return;
        }
        
        console.log('[useBinanceData] Setting data and loading state...');
        setData(klines);
        setLoading(false);
        setError(null); // Clear any previous errors
        console.log('[useBinanceData] State updated: data set, loading false');
      } catch (err) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // Check if it's an abort error or cancelled
        if (err instanceof Error && err.name === 'AbortError') {
          console.warn('[useBinanceData] Request aborted, skipping error state update');
          return;
        }
        
        if (isCancelled) {
          console.warn('[useBinanceData] Request cancelled, skipping error state update');
          return;
        }
        
        console.error('Error fetching klines:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(new Error(errorMessage));
        setLoading(false);
      }
    };

    performFetch();

    // Cleanup: abort fetch if component unmounts or dependencies change
    return () => {
      console.log('[useBinanceData] useEffect cleanup - aborting fetch');
      isCancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      abortController.abort();
    };
  }, [symbol, interval, limit]); // Depend on actual values, not the callback

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Only connect WebSocket after initial data is loaded
    if (!enableWebSocket || !validateSymbol(symbol) || loading || data.length === 0) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }


    wsRef.current = createKlineWebSocket(
      symbol,
      interval,
      (newKline) => {
        if (isMountedRef.current) {
          setData((prevData) => {
            const lastKline = prevData[prevData.length - 1];
            
            // If the new candle has the same time as the last one, update it
            if (lastKline && lastKline.time === newKline.time) {
              return [...prevData.slice(0, -1), newKline];
            }
            
            // Otherwise, add the new candle and keep the limit
            const updated = [...prevData, newKline];
            return updated.slice(-calculatedLimit);
          });
        }
      },
      (wsError) => {
        // WebSocket errors are non-critical, just log them
        // The WebSocket will attempt to reconnect automatically if possible
        console.warn('WebSocket connection issue (non-critical):', wsError);
        // Don't set error state for WebSocket errors as they don't affect initial data load
        // The WebSocket is only for real-time updates
      }
    );

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbol, interval, enableWebSocket, loading, data.length, calculatedLimit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const refetch = useCallback(async () => {
    // Force reset loading state and skip mounted check for refetch
    setLoading(true);
    setError(null);
    try {
      await fetchData(true); // Skip mounted check for refetch
    } catch (err) {
      // fetchData already handles errors, but ensure loading is false
      setLoading(false);
      throw err;
    }
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

