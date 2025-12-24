'use client';

import { useEffect, useRef, useMemo, memo, useCallback } from 'react';
import type { Time } from 'lightweight-charts';
import { useBinanceData } from '../hooks/useBinanceData';
import { useChartMouseInteraction } from '../hooks/useChartMouseInteraction';
import { useChartInitialization } from '../hooks/useChartInitialization';
import { useChartData } from '../hooks/useChartData';
import { useChartVolume } from '../hooks/useChartVolume';
import { useChartIndicators } from '../hooks/useChartIndicators';
import { useChartLines } from '../hooks/useChartLines';
import { useCrosshair } from '../hooks/useCrosshair';
import { calculateIndicator } from '../utils/indicators';
import { ErrorOverlay } from './ErrorOverlay';
import { LoadingOverlay } from './LoadingOverlay';
import { CrosshairLabels } from './CrosshairLabels';
import styles from './Chart.module.css';
import { CHART_CONFIG } from '../constants';
import type { KlineInterval } from '../types/binance';
import type { IndicatorConfigUnion } from '../types/indicators';
import type { HorizontalLineConfig } from '../types/lines';

interface ChartProps {
  symbol?: string;
  interval?: KlineInterval;
  height?: number;
  indicators?: IndicatorConfigUnion[];
  horizontalLines?: HorizontalLineConfig[];
  onAddLineAtPrice?: (price: number) => void;
  enableLineAdding?: boolean;
}

/**
 * Performance-optimized Chart component
 * Uses refs for mouse tracking to avoid re-renders
 */
const ChartComponent = ({
  symbol = 'BTCUSDT',
  interval = '1h',
  height = CHART_CONFIG.defaultHeight,
  indicators = [],
  horizontalLines = [],
  onAddLineAtPrice,
  enableLineAdding = true,
}: ChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // Refs for crosshair labels (DOM manipulation, no re-render)
  const priceLabelRef = useRef<HTMLDivElement>(null);
  const timeLabelRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Refs for mouse interaction (no re-render on mouse move)
  const hoveredPriceRef = useRef<number | null>(null);
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null);

  const { data, loading, error, refetch } = useBinanceData({
    symbol,
    interval,
    enableWebSocket: true,
  });

  const { chart, series, volumeSeries } = useChartInitialization({
    containerRef: chartContainerRef,
    height,
  });

  useChartData({ chart, series, data });

  useChartVolume({
    chart,
    volumeSeries,
    data,
    candlestickSeries: series,
  });

  // Calculate indicator data (memoized)
  const indicatorData = useMemo(() => {
    if (data.length === 0 || indicators.length === 0) return new Map<string, Array<{ time: Time; value: number }>>();

    const result = new Map<string, Array<{ time: Time; value: number }>>();

    indicators.forEach((config) => {
      const period = 'period' in config ? config.period : 'default';
      const indicatorKey = `${config.type}-${period}`;
      const calculated = calculateIndicator(data, config);
      const chartData = calculated.map((point) => ({
        time: point.time as Time,
        value: point.value,
      }));
      result.set(indicatorKey, chartData);
    });

    return result;
  }, [data, indicators]);

  useChartIndicators({
    chart,
    indicators,
    indicatorData,
    hasData: data.length > 0,
  });

  useChartLines({
    series,
    horizontalLines,
    hasData: data.length > 0,
  });

  // Mouse interaction (always active for crosshair, line adding only when enabled)
  const { isHovering } = useChartMouseInteraction({
    chart,
    series,
    chartContainer: chartContainerRef.current,
    enableLineAdding: enableLineAdding && !loading && data.length > 0,
    onAddLine: onAddLineAtPrice,
    hoveredPriceRef,
    mousePositionRef,
  });

  // Crosshair labels (optimized with refs + DOM manipulation)
  useCrosshair({
    chart,
    series,
    container: chartContainerRef.current,
    hasData: data.length > 0,
    priceLabelRef,
    timeLabelRef,
    tooltipRef,
  });

  // Memoized callbacks
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Memoized computed values
  const hasError = useMemo(() => error !== null && data.length === 0, [error, data.length]);
  const isLoading = useMemo(() => loading && data.length === 0 && !error, [loading, data.length, error]);
  const chartCursorClass = useMemo(
    () => (isHovering && enableLineAdding ? styles.chartCanvasCrosshair : styles.chartCanvasDefault),
    [isHovering, enableLineAdding]
  );

  // Get hovered price from ref for display
  const hoveredPrice = hoveredPriceRef.current;

  return (
    <div className={styles.chartContainer} style={{ height: `${height}px` }}>
      {/* Error overlay */}
      {hasError && <ErrorOverlay error={error!} onRetry={handleRetry} />}

      {/* Loading overlay */}
      {isLoading && <LoadingOverlay />}

      {/* Chart container */}
      <div
        ref={chartContainerRef}
        className={`${styles.chartWrapper} ${chartCursorClass}`}
        style={{ height: `${height}px` }}
      />

      {/* Crosshair labels - optimized with refs, all managed by useCrosshair hook */}
      <CrosshairLabels
        priceLabelRef={priceLabelRef}
        timeLabelRef={timeLabelRef}
        tooltipRef={tooltipRef}
      />
    </div>
  );
};

// Memoize Chart component to prevent unnecessary re-renders
export const Chart = memo(ChartComponent, (prevProps, nextProps) => {
  // Only re-render if props that affect rendering change
  return (
    prevProps.symbol === nextProps.symbol &&
    prevProps.interval === nextProps.interval &&
    prevProps.height === nextProps.height &&
    prevProps.enableLineAdding === nextProps.enableLineAdding &&
    prevProps.indicators === nextProps.indicators &&
    prevProps.horizontalLines === nextProps.horizontalLines
  );
});
