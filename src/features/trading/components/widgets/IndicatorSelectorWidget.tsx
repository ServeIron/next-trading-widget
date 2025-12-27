'use client';

/**
 * Indicator Selector Widget
 * Allows multiple indicator selection
 * Uses generic DropdownWidget for consistent UI
 * PERFORMANCE OPTIMIZED: Memoized to prevent unnecessary re-renders
 */

import { memo, useMemo, useCallback } from 'react';
import { DropdownWidget, type DropdownItem } from './DropdownWidget';
import type { IndicatorType } from '../../types/indicators';

interface IndicatorSelectorWidgetProps {
  /**
   * Selected indicator types
   */
  value: IndicatorType[];

  /**
   * Callback when selection changes
   */
  onChange: (indicators: IndicatorType[]) => void;
}

// Available indicators with default configurations
export const AVAILABLE_INDICATORS: DropdownItem<IndicatorType>[] = [
  { value: 'MA', label: 'MA (SMA)' },
  { value: 'EMA', label: 'EMA' },
  { value: 'RSI', label: 'RSI' },
];

/**
 * Widget for indicator selection with dropdown menu
 * Supports multiple selection
 * PERFORMANCE OPTIMIZED: Memoized to prevent unnecessary re-renders
 */
const IndicatorSelectorWidgetComponent = ({ value, onChange }: IndicatorSelectorWidgetProps) => {
  const handleChange = useCallback(
    (newValue: IndicatorType | IndicatorType[]) => {
      // Multiple selection
      if (Array.isArray(newValue)) {
        onChange(newValue);
      } else {
        // Single value - convert to array
        onChange([newValue]);
      }
    },
    [onChange]
  );

  const formatLabel = useCallback((selected: DropdownItem<IndicatorType> | DropdownItem<IndicatorType>[]): string => {
    if (Array.isArray(selected)) {
      if (selected.length === 0) return 'İndikatör Seç';
      if (selected.length === 1) return selected[0].label;
      return `${selected.length} İndikatör`;
    }
    return selected.label;
  }, []);

  return (
    <DropdownWidget
      value={value}
      items={AVAILABLE_INDICATORS}
      onChange={handleChange}
      multiple={true}
      placeholder="İndikatör Seç"
      formatLabel={formatLabel}
      ariaLabel="İndikatör seç"
    />
  );
};

export const IndicatorSelectorWidget = memo(IndicatorSelectorWidgetComponent);

