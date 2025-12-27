'use client';

/**
 * Interval Selector Widget
 * Uses generic DropdownWidget for consistent UI
 * PERFORMANCE OPTIMIZED: Memoized to prevent unnecessary re-renders
 */

import { memo, useMemo } from 'react';
import { DropdownWidget, type DropdownItem } from './DropdownWidget';
import type { KlineInterval } from '../../types/binance';

interface IntervalSelectorWidgetProps {
  value: KlineInterval;
  onChange: (interval: KlineInterval) => void;
}

// Note: Binance API supports limited intervals
// For custom intervals (3A, 6A, Bu Sene, 1Y, 2Y, 5Y), we use the closest supported interval
// and adjust the data fetching logic accordingly
const INTERVALS: DropdownItem<KlineInterval>[] = [
  { value: '1m', label: '1DK' },
  { value: '5m', label: '5DK' },
  { value: '15m', label: '15DK' },
  { value: '30m', label: '30DK' },
  { value: '1h', label: '1S' },
  { value: '4h', label: '4S' },
  { value: '1d', label: '1G' },
  { value: '1w', label: '7G' },
  { value: '1M', label: '1A' },
  // Note: 3A, 6A, Bu Sene, 1Y, 2Y, 5Y are not directly supported by Binance API
  // They would require custom data aggregation logic
];

/**
 * Widget for interval selection with dropdown menu
 * PERFORMANCE OPTIMIZED: Memoized to prevent unnecessary re-renders
 */
const IntervalSelectorWidgetComponent = ({ value, onChange }: IntervalSelectorWidgetProps) => {
  const handleChange = (newValue: KlineInterval | KlineInterval[]) => {
    // Single selection only
    if (Array.isArray(newValue)) {
      onChange(newValue[0] as KlineInterval);
    } else {
      onChange(newValue);
    }
  };

  return (
    <DropdownWidget
      value={value}
      items={INTERVALS}
      onChange={handleChange}
      multiple={false}
      ariaLabel="Zaman aralığı seç"
    />
  );
};

export const IntervalSelectorWidget = memo(IntervalSelectorWidgetComponent);
