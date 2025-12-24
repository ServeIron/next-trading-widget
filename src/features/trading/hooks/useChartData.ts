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

      // Zoom to show last N bars instead of all data
      const visibleBars = CHART_CONFIG.initialVisibleBars;
      if (chartData.length > visibleBars) {
        // Show last N bars
        const startIndex = chartData.length - visibleBars;
        const startTime = chartData[startIndex]?.time;
        const endTime = chartData[chartData.length - 1]?.time;

        if (startTime && endTime) {
          chart.timeScale().setVisibleRange({
            from: startTime,
            to: endTime,
          });
        }
      } else {
        // If we have less data than visible bars, show all
        chart.timeScale().fitContent();
      }
    } catch (err) {
      // Chart might be disposed, ignore error
      console.warn('Chart data update error (chart may be disposed):', err);
    }
  }, [chart, series, data]);
}

