'use client';

/**
 * Symbol and OHLC Widget Component
 * Displays current symbol and OHLC data of the bar under mouse cursor
 * PERFORMANCE OPTIMIZED: Memoized to prevent unnecessary re-renders
 */

import { memo, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import styles from './SymbolAndOHLCWidget.module.css';
import type { HoveredBarData } from '../../types/ohlc';
import { formatPrice, isBarPositive } from '../../utils/ohlc';

interface SymbolAndOHLCWidgetProps {
  /**
   * Current symbol (e.g., "BTCUSDT")
   */
  symbol: string;

  /**
   * OHLC data of the bar under mouse cursor
   */
  hoveredBarData: HoveredBarData | null;

  /**
   * OHLC data of the last bar (shown when hoveredBarData is null)
   */
  lastBarData: HoveredBarData | null;
}

/**
 * OHLC Item Component
 * Displays a single OHLC value (Open, High, Low, or Close)
 */
interface OHLCItemProps {
  label: string;
  value: number;
  isPositive: boolean | null;
}

const OHLCItem = memo(({ label, value, isPositive }: OHLCItemProps) => {
  const colorClass = isPositive !== null ? (isPositive ? styles.positive : styles.negative) : '';

  return (
    <Typography className={styles.ohlcItem} component="span">
      <span className={styles.ohlcLabel}>{label}</span>
      <span className={`${styles.ohlcValue} ${colorClass}`}>{formatPrice(value)}</span>
    </Typography>
  );
});

OHLCItem.displayName = 'OHLCItem';

/**
 * Widget for displaying symbol and OHLC data
 * PERFORMANCE OPTIMIZED: Memoized to prevent unnecessary re-renders
 */
const SymbolAndOHLCWidgetComponent = ({ symbol, hoveredBarData, lastBarData }: SymbolAndOHLCWidgetProps) => {
  // Use hovered bar data if available, otherwise use last bar data
  // PERFORMANCE: Memoized to prevent recalculation on every render
  const displayData = useMemo(() => hoveredBarData || lastBarData, [hoveredBarData, lastBarData]);

  // Determine if bar is positive (green) or negative (red)
  // PERFORMANCE: Memoized to prevent recalculation on every render
  const isPositive = useMemo(
    () => (displayData ? isBarPositive(displayData.open, displayData.close) : null),
    [displayData]
  );

  return (
    <Box className={styles.widget}>
      {/* Symbol */}
      <Typography className={styles.symbol} component="span">
        {symbol}
      </Typography>

      {/* OHLC Data */}
      {displayData ? (
        <Box className={styles.ohlcContainer}>
          <OHLCItem label="A" value={displayData.open} isPositive={isPositive} />
          <OHLCItem label="Y" value={displayData.high} isPositive={isPositive} />
          <OHLCItem label="D" value={displayData.low} isPositive={isPositive} />
          <OHLCItem label="K" value={displayData.close} isPositive={isPositive} />
        </Box>
      ) : null}
    </Box>
  );
};

export const SymbolAndOHLCWidget = memo(SymbolAndOHLCWidgetComponent);

