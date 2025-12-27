'use client';

/**
 * Trading Chart Module - Main Public Component
 * PERFORMANCE OPTIMIZED: Memoized callbacks and optimized re-renders
 */

import { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { setApiConfig } from '../services/binance';
import { useContainerSize } from '../hooks/useContainerSize';
import { IntervalSelectorWidget, IndicatorSelectorWidget, SymbolAndOHLCWidget } from './widgets';
import type { HoveredBarData } from '../types/ohlc';
import { LineContextMenu } from './LineContextMenu';
import { PRESET_LINE_COLORS, CHART_CONFIG } from '../constants';
import type { TradingModuleConfig } from '../types/config';
import type { KlineInterval } from '../types/binance';
import type { HorizontalLineConfig } from '../types/lines';
import type { IndicatorConfigUnion, IndicatorType } from '../types/indicators';
import styles from './TradingChartModule.module.css';

// Dynamic import for Chart component (client-side only, no SSR)
const DynamicChart = dynamic(() => import('./Chart').then((mod) => ({ default: mod.Chart })), {
  ssr: false,
  loading: () => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Yükleniyor...</div>,
});

export interface TradingChartModuleProps {
  /**
   * Configuration for the trading module
   */
  config: TradingModuleConfig;

  /**
   * Optional: Custom CSS class name for the container
   */
  className?: string;

  /**
   * Optional: Custom CSS styles for the container
   */
  style?: React.CSSProperties;
}

/**
 * Main Trading Chart Module Component
 * PERFORMANCE OPTIMIZED: All callbacks memoized
 */
const TradingChartModuleComponent = ({ config, className, style }: TradingChartModuleProps) => {
  // Chart section ref for measuring available chart area
  const chartSectionRef = useRef<HTMLDivElement>(null);
  
  // Initialize API config on mount
  useEffect(() => {
    setApiConfig(config.api);
  }, [config.api]);

  const [interval, setIntervalState] = useState<KlineInterval>((config.defaultInterval as KlineInterval) || '1d');
  const symbol = config.defaultSymbol || 'BTCUSDT';
  const [horizontalLines, setHorizontalLines] = useState<HorizontalLineConfig[]>([]);
  const [selectedIndicators, setSelectedIndicators] = useState<IndicatorType[]>([]);
  const [hoveredBarData, setHoveredBarData] = useState<HoveredBarData | null>(null);
  const [lastBarData, setLastBarData] = useState<HoveredBarData | null>(null);
  
  // Line context menu state
  const [selectedLine, setSelectedLine] = useState<HorizontalLineConfig | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Measure chart section size for plug-and-play functionality
  // This automatically accounts for header height since we're measuring the chart section directly
  const minHeight = config.defaultHeight || CHART_CONFIG.defaultHeight;
  const { height: chartHeight } = useContainerSize({
    containerRef: chartSectionRef,
    headerHeight: 0, // No need to subtract header, we're measuring chart section directly
    minHeight,
  });

  // Memoized callbacks to prevent unnecessary re-renders
  const handleAddLineAtPrice = useCallback((price: number) => {
    setHorizontalLines((prev) => {
      const newLine: HorizontalLineConfig = {
        id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        price,
        color: PRESET_LINE_COLORS[prev.length % PRESET_LINE_COLORS.length],
        lineWidth: 2,
        lineStyle: 'solid',
        label: price.toFixed(2),
        labelVisible: true,
      };
      return [...prev, newLine];
    });
  }, []);

  const handleIntervalChange = useCallback((newInterval: KlineInterval) => {
    setIntervalState(newInterval);
  }, []);

  // Convert selected indicator types to IndicatorConfigUnion
  const indicatorConfigs = useMemo((): IndicatorConfigUnion[] => {
    return selectedIndicators.map((type): IndicatorConfigUnion => {
      switch (type) {
        case 'MA':
          return { type: 'MA', period: 20, color: '#ff9800', lineWidth: 2 };
        case 'EMA':
          return { type: 'EMA', period: 12, color: '#2196f3', lineWidth: 2 };
        case 'RSI':
          return { type: 'RSI', period: 14, color: '#9c27b0', lineWidth: 2 };
        default:
          return { type: 'MA', period: 20, color: '#ff9800', lineWidth: 2 };
      }
    });
  }, [selectedIndicators]);

  const handleIndicatorChange = useCallback((indicators: IndicatorType[]) => {
    setSelectedIndicators(indicators);
  }, []);

  // Handle hovered bar data change
  const handleHoveredBarDataChange = useCallback((data: HoveredBarData | null) => {
    setHoveredBarData(data);
  }, []);

  // Handle last bar data change (for default display)
  const handleLastBarDataChange = useCallback((data: HoveredBarData | null) => {
    setLastBarData(data);
  }, []);

  // Handle line click - show context menu
  const handleLineClick = useCallback((lineId: string, price: number, event: MouseEvent) => {
    const line = horizontalLines.find((l) => l.id === lineId);
    if (line) {
      setSelectedLine(line);
      setIsMenuOpen(true);
    }
  }, [horizontalLines]);

  // Handle menu close
  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
    setSelectedLine(null);
  }, []);

  // Handle delete line
  const handleDeleteLine = useCallback((lineId: string) => {
    setHorizontalLines((prev) => prev.filter((line) => line.id !== lineId));
  }, []);

  // Handle change color
  const handleColorChange = useCallback((lineId: string, color: string) => {
    setHorizontalLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, color } : line))
    );
  }, []);

  return (
    <div className={`${styles.module} ${className || ''}`} style={style}>
      {/* Header Bar - TradingView style */}
      <div className={styles.header}>
        {/* Interval Selector Widget */}
        <IntervalSelectorWidget value={interval} onChange={handleIntervalChange} />
        
        {/* Indicator Selector Widget */}
        <IndicatorSelectorWidget value={selectedIndicators} onChange={handleIndicatorChange} />

        {/* Symbol and OHLC Widget */}
        <SymbolAndOHLCWidget symbol={symbol} hoveredBarData={hoveredBarData} lastBarData={lastBarData} />
      </div>

      {/* Chart - Full height */}
      <div ref={chartSectionRef} className={styles.chartSection}>
        <DynamicChart
          symbol={symbol}
          interval={interval}
          height={chartHeight}
          indicators={indicatorConfigs}
          horizontalLines={horizontalLines}
          onAddLineAtPrice={handleAddLineAtPrice}
          enableLineAdding={true}
          onLineClick={handleLineClick}
          onHoveredBarDataChange={handleHoveredBarDataChange}
          onLastBarDataChange={handleLastBarDataChange}
        />
      </div>

      {/* Line Context Menu */}
      <LineContextMenu
        open={isMenuOpen}
        selectedLine={selectedLine}
        onClose={handleMenuClose}
        onDelete={handleDeleteLine}
        onColorChange={handleColorChange}
      />
    </div>
  );
};

// Memoize to prevent unnecessary re-renders from parent
export const TradingChartModule = memo(TradingChartModuleComponent);
