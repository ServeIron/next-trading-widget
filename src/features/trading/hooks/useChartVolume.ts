/**
 * Custom hook for managing volume data updates
 */

import { useEffect } from 'react';
import type { Time } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import type { BinanceKline } from '../types/binance';
import { CHART_COLORS } from '../constants';

interface UseChartVolumeOptions {
  chart: IChartApi | null;
  volumeSeries: ISeriesApi<'Histogram'> | null;
  data: BinanceKline[];
  candlestickSeries: ISeriesApi<'Candlestick'> | null;
}

/**
 * Custom hook for managing volume histogram series
 * Colors volume bars based on candlestick direction (green for up, red for down)
 */
export function useChartVolume({
  chart,
  volumeSeries,
  data,
  candlestickSeries,
}: UseChartVolumeOptions): void {
  useEffect(() => {
    if (!chart || !volumeSeries || !candlestickSeries) {
      return;
    }

    // Clear volume data if data is empty
    if (data.length === 0) {
      try {
        volumeSeries.setData([]);
      } catch (err) {
        // Chart might be disposed, ignore error
        console.warn('Volume data clear error (chart may be disposed):', err);
      }
      return;
    }

    try {
      // Create volume data with colors based on candlestick direction
      const volumeData = data.map((kline) => {
        // Determine if candle is up or down
        const isUp = kline.close >= kline.open;
        const color = isUp ? CHART_COLORS.volumeUp : CHART_COLORS.volumeDown;

        return {
          time: kline.time as Time,
          value: kline.volume,
          color,
        };
      });

      volumeSeries.setData(volumeData);
    } catch (err) {
      // Chart might be disposed, ignore error
      console.warn('Volume data update error (chart may be disposed):', err);
    }
  }, [chart, volumeSeries, data, candlestickSeries]);
}

