'use client';

import { memo, useCallback } from 'react';
import styles from './IntervalSelectorWidget.module.css';
import type { KlineInterval } from '../../types/binance';

interface IntervalSelectorWidgetProps {
  value: KlineInterval;
  onChange: (interval: KlineInterval) => void;
}

const INTERVALS: { value: KlineInterval; label: string }[] = [
  { value: '1m', label: '1Dk' },
  { value: '5m', label: '5Dk' },
  { value: '15m', label: '15Dk' },
  { value: '30m', label: '30Dk' },
  { value: '1h', label: '1S' },
  { value: '4h', label: '4S' },
  { value: '1d', label: '1G' },
  { value: '1w', label: '1H' },
];

/**
 * Widget for interval selection
 * PERFORMANCE OPTIMIZED: Memoized to prevent unnecessary re-renders
 */
const IntervalSelectorWidgetComponent = ({ value, onChange }: IntervalSelectorWidgetProps) => {
  const handleIntervalClick = useCallback((intervalValue: KlineInterval) => {
    onChange(intervalValue);
  }, [onChange]);

  return (
    <div className={styles.widget}>
      {INTERVALS.map((interval) => {
        const isActive = value === interval.value;
        return (
          <button
            key={interval.value}
            onClick={() => handleIntervalClick(interval.value)}
            className={`${styles.button} ${isActive ? styles.buttonActive : styles.buttonInactive}`}
            type="button"
          >
            {interval.label}
          </button>
        );
      })}
    </div>
  );
};

export const IntervalSelectorWidget = memo(IntervalSelectorWidgetComponent);
