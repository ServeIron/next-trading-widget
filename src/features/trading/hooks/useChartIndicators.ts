/**
 * Custom hook for managing chart indicators
 */

import { useEffect, useRef } from 'react';
import { LineSeries, type Time, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import type { IndicatorConfigUnion } from '../types/indicators';
import { INDICATOR_DEFAULT_COLOR } from '../constants';

interface UseChartIndicatorsOptions {
  chart: IChartApi | null;
  indicators: IndicatorConfigUnion[];
  indicatorData: Map<string, Array<{ time: Time; value: number }>>;
  hasData: boolean;
}

export function useChartIndicators({
  chart,
  indicators,
  indicatorData,
  hasData,
}: UseChartIndicatorsOptions): void {
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());

  useEffect(() => {
    if (!chart || !hasData) return;

    // Remove indicators that are no longer selected
    const currentKeys = new Set(
      indicators.map((config) => {
        const period = 'period' in config ? config.period : 'default';
        return `${config.type}-${period}`;
      })
    );

    indicatorSeriesRef.current.forEach((series, key) => {
      if (!currentKeys.has(key)) {
        try {
          chart.removeSeries(series);
          indicatorSeriesRef.current.delete(key);
        } catch (err) {
          // Chart might be disposed, ignore error
          console.warn('Failed to remove indicator series (chart may be disposed):', err);
          indicatorSeriesRef.current.delete(key);
        }
      }
    });

    // Add or update indicators
    indicators.forEach((config) => {
      const period = 'period' in config ? config.period : 'default';
      const indicatorKey = `${config.type}-${period}`;
      const indicatorChartData = indicatorData.get(indicatorKey);

      if (!indicatorChartData || indicatorChartData.length === 0) return;

      let series = indicatorSeriesRef.current.get(indicatorKey);

      if (!series) {
        try {
          // Create new series
          series = chart.addSeries(LineSeries, {
            color: config.color || INDICATOR_DEFAULT_COLOR,
            lineWidth: (config.lineWidth || 2) as 1 | 2 | 3 | 4,
            priceLineVisible: false,
            lastValueVisible: true,
            title: `${config.type} ${period !== 'default' ? period : ''}`.trim(),
          });
          indicatorSeriesRef.current.set(indicatorKey, series);
        } catch (err) {
          // Chart might be disposed, skip this indicator
          console.warn('Failed to add indicator series (chart may be disposed):', err);
          return;
        }
      }

      // Update series data
      try {
        series.setData(indicatorChartData);
      } catch (err) {
        // Chart might be disposed, ignore error
        console.warn('Failed to set indicator data (chart may be disposed):', err);
      }
    });
  }, [chart, indicators, indicatorData, hasData]);
}

