/**
 * Custom hook for getting OHLC data of the bar under mouse cursor
 * PERFORMANCE OPTIMIZED: Uses refs to avoid re-renders on every mouse movement
 */

import { useEffect, useRef, useState } from 'react';
import type { IChartApi, ISeriesApi, MouseEventParams } from 'lightweight-charts';
import type { BinanceKline } from '../types/binance';
import type { HoveredBarData } from '../types/ohlc';

interface UseHoveredBarDataOptions {
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick'> | null;
  data: BinanceKline[];
  hasData: boolean;
}

interface UseHoveredBarDataReturn {
  hoveredBarData: HoveredBarData | null;
}

/**
 * Find bar data by time (binary search for performance)
 */
function findBarByTime(data: BinanceKline[], time: number): BinanceKline | null {
  if (data.length === 0) return null;

  // Binary search for exact time match
  let left = 0;
  let right = data.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midTime = data[mid].time;

    if (midTime === time) {
      return data[mid];
    } else if (midTime < time) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // If exact match not found, return closest bar
  if (right >= 0 && right < data.length) {
    return data[right];
  }

  return null;
}

/**
 * Custom hook for getting OHLC data of the bar under mouse cursor
 */
export function useHoveredBarData({
  chart,
  series,
  data,
  hasData,
}: UseHoveredBarDataOptions): UseHoveredBarDataReturn {
  const [hoveredBarData, setHoveredBarData] = useState<HoveredBarData | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!chart || !series || !hasData || data.length === 0) {
      setHoveredBarData(null);
      return;
    }

    // Throttled handler using requestAnimationFrame
    const crosshairHandler = (param: MouseEventParams) => {
      // Check if chart is still valid
      try {
        if (!chart || !chart.chartElement()) {
          return;
        }
      } catch {
        // Chart is disposed, ignore
        return;
      }

      // Cancel previous RAF if exists
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        // Double-check chart is still valid inside RAF
        try {
          if (!chart || !chart.chartElement()) {
            return;
          }
        } catch {
          // Chart is disposed, ignore
          return;
        }

        // Get time from crosshair event
        if (param.time && typeof param.time === 'number') {
          const barTime = param.time;
          const bar = findBarByTime(data, barTime);

          if (bar) {
            setHoveredBarData({
              open: bar.open,
              high: bar.high,
              low: bar.low,
              close: bar.close,
              time: bar.time,
            });
          } else {
            setHoveredBarData(null);
          }
        } else {
          setHoveredBarData(null);
        }
      });
    };

    try {
      chart.subscribeCrosshairMove(crosshairHandler);
    } catch (err) {
      // Chart might be disposed, ignore error
      console.warn('Failed to subscribe to crosshair for bar data (chart may be disposed):', err);
      return;
    }

    const handleMouseLeave = () => {
      // Clear bar data on mouse leave
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setHoveredBarData(null);
    };

    // Get container to listen for mouse leave
    try {
      const chartElement = chart.chartElement();
      if (chartElement) {
        chartElement.addEventListener('mouseleave', handleMouseLeave);
      }
    } catch {
      // Chart might be disposed, ignore
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      try {
        chart.unsubscribeCrosshairMove(crosshairHandler);
        const chartElement = chart.chartElement();
        if (chartElement) {
          chartElement.removeEventListener('mouseleave', handleMouseLeave);
        }
      } catch (err) {
        // Chart might be disposed, ignore error
        console.warn('Failed to unsubscribe from crosshair (chart may be disposed):', err);
      }
    };
  }, [chart, series, data, hasData]);

  return {
    hoveredBarData,
  };
}

