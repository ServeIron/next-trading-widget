/**
 * Custom hook for chart initialization and cleanup
 */

import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import { CHART_COLORS } from '../constants';

interface UseChartInitializationOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  height: number;
}

interface UseChartInitializationReturn {
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick'> | null;
  volumeSeries: ISeriesApi<'Histogram'> | null;
}

export function useChartInitialization({
  containerRef,
  height,
}: UseChartInitializationOptions): UseChartInitializationReturn {
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.background },
        textColor: CHART_COLORS.text,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      width: containerRef.current.clientWidth,
      height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1, // Normal mode - shows both vertical and horizontal lines
        vertLine: {
          color: CHART_COLORS.crosshair,
          width: 1,
          style: 0, // Solid
          labelVisible: false, // Hide default label, we'll show custom one
        },
        horzLine: {
          color: CHART_COLORS.crosshair,
          width: 1,
          style: 0, // Solid
          labelVisible: false, // Hide default label, we'll show custom one
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
    });

    // Configure right price scale for candlesticks (default, shows prices)
    chart.priceScale('right').applyOptions({
      scaleMargins: {
        top: 0.1,
        bottom: 0.3, // Leave 30% of space at bottom for volume
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: CHART_COLORS.candleUp,
      downColor: CHART_COLORS.candleDown,
      borderVisible: false,
      wickUpColor: CHART_COLORS.candleUp,
      wickDownColor: CHART_COLORS.candleDown,
      // Use default right price scale for candlesticks (shows prices correctly)
    });

    // Configure left price scale for volume (hidden, only for volume positioning)
    chart.priceScale('left').applyOptions({
      visible: false, // Hide left price scale
      scaleMargins: {
        top: 0.7, // Start volume at 70% from top (leaving 70% for candlesticks)
        bottom: 0.05, // Small margin at bottom
      },
    });

    // Add volume histogram series with left price scale (hidden)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'left', // Use left price scale for volume (hidden)
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Resize observer for responsive design
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || entries[0].target !== containerRef.current) return;
      if (!chartRef.current) return; // Check if chart is still valid
      
      try {
        const newRect = entries[0].contentRect;
        chartRef.current.applyOptions({ width: newRect.width });
      } catch (err) {
        // Chart might be disposed, ignore error
        console.warn('Chart resize error (chart may be disposed):', err);
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      try {
        if (chartRef.current) {
          chartRef.current.remove();
        }
      } catch (err) {
        // Ignore errors during cleanup
        console.warn('Chart cleanup error:', err);
      }
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [containerRef, height]);

  return {
    chart: chartRef.current,
    series: seriesRef.current,
    volumeSeries: volumeSeriesRef.current,
  };
}

