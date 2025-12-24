'use client';

/**
 * Trading Chart Module - Main Public Component
 * PERFORMANCE OPTIMIZED: Memoized callbacks and optimized re-renders
 */

import { useState, useEffect, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import { setApiConfig } from '../services/binance';
import { SymbolSelectorWidget, IntervalSelectorWidget, LineAddWidget } from './widgets';
import { PRESET_LINE_COLORS } from '../constants';
import type { TradingModuleConfig } from '../types/config';
import type { KlineInterval } from '../types/binance';
import type { HorizontalLineConfig } from '../types/lines';
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
  // Initialize API config on mount
  useEffect(() => {
    setApiConfig(config.api);
  }, [config.api]);

  const [symbol, setSymbol] = useState<string>(config.defaultSymbol || 'BTCUSDT');
  const [interval, setIntervalState] = useState<KlineInterval>((config.defaultInterval as KlineInterval) || '1d');
  const [chartHeight, setChartHeight] = useState<number>(config.defaultHeight || 600);
  const [horizontalLines, setHorizontalLines] = useState<HorizontalLineConfig[]>([]);
  const [isLineAddingMode, setIsLineAddingMode] = useState<boolean>(false);

  // Calculate chart height based on window size (memoized resize handler)
  useEffect(() => {
    const headerHeight = config.headerHeight || 60;
    const updateHeight = () => {
      setChartHeight(window.innerHeight - headerHeight);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [config.headerHeight]);

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

  const handleSymbolChange = useCallback((newSymbol: string) => {
    setSymbol(newSymbol);
  }, []);

  const handleIntervalChange = useCallback((newInterval: KlineInterval) => {
    setIntervalState(newInterval);
  }, []);

  const handleToggleLineAdding = useCallback(() => {
    setIsLineAddingMode((prev) => !prev);
  }, []);

  return (
    <div className={`${styles.module} ${className || ''}`} style={style}>
      {/* Header Bar - TradingView style */}
      <div className={styles.header}>
        {/* Symbol Selector Widget */}
        <SymbolSelectorWidget symbol={symbol} onSymbolChange={handleSymbolChange} />

        {/* Interval Selector Widget */}
        <IntervalSelectorWidget value={interval} onChange={handleIntervalChange} />

        {/* Line Add Widget */}
        <LineAddWidget isActive={isLineAddingMode} onToggle={handleToggleLineAdding} />
      </div>

      {/* Chart - Full height */}
      <div className={styles.chartSection}>
        <DynamicChart
          symbol={symbol}
          interval={interval}
          height={chartHeight}
          indicators={[]}
          horizontalLines={horizontalLines}
          onAddLineAtPrice={handleAddLineAtPrice}
          enableLineAdding={isLineAddingMode}
        />
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders from parent
export const TradingChartModule = memo(TradingChartModuleComponent);
