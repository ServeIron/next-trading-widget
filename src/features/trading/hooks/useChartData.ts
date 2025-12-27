/**
 * Custom hook for managing chart data updates
 */

import { useEffect } from 'react';
import type { Time } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import type { BinanceKline } from '../types/binance';
import { CHART_CONFIG } from '../constants';

interface UseChartDataOptions {
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick'> | null;
  data: BinanceKline[];
}

export function useChartData({
  chart,
  series,
  data,
}: UseChartDataOptions): void {
  useEffect(() => {
    if (!chart || !series) {
      return;
    }

    // Clear chart data if data is empty
    if (data.length === 0) {
      try {
        series.setData([]);
      } catch (err) {
        // Chart might be disposed, ignore error
        console.warn('Chart data clear error (chart may be disposed):', err);
      }
      return;
    }

    try {
      const chartData = data.map((kline) => ({
        time: kline.time as Time,
        open: kline.open,
        high: kline.high,
        low: kline.low,
        close: kline.close,
      }));

      series.setData(chartData);

      // Reset scroll position and zoom to show last N bars
      // Use requestAnimationFrame to ensure data is set before adjusting view
      requestAnimationFrame(() => {
        try {
          const visibleBars = CHART_CONFIG.initialVisibleBars;
          if (chartData.length > visibleBars) {
            // Show last N bars - ensure right edge is visible
            const startIndex = chartData.length - visibleBars;
            const startTime = chartData[startIndex]?.time;
            const endTime = chartData[chartData.length - 1]?.time;

            if (startTime && endTime) {
              // Set visible range - this will show the last N bars
              // The rightBarStaysOnScroll and rightOffset settings will keep the right edge visible
              chart.timeScale().setVisibleRange({
                from: startTime,
                to: endTime,
              });
              
              // Ensure we're scrolled to the right edge
              // scrollToRealTime() scrolls to the latest data point
              try {
                chart.timeScale().scrollToRealTime();
              } catch {
                // scrollToRealTime might not be available, that's okay
                // The setVisibleRange should position correctly
              }
            }
          } else {
            // If we have less data than visible bars, show all
            chart.timeScale().fitContent();
          }
        } catch (err) {
          // Chart might be disposed, ignore error
          console.warn('Chart visible range update error (chart may be disposed):', err);
        }
      });
    } catch (err) {
      // Chart might be disposed, ignore error
      console.warn('Chart data update error (chart may be disposed):', err);
    }
  }, [chart, series, data]);
}

