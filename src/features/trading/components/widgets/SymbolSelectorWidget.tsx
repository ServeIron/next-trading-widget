'use client';

import { memo, useCallback } from 'react';
import styles from './SymbolSelectorWidget.module.css';
import { POPULAR_SYMBOLS } from '../../constants';

interface SymbolSelectorWidgetProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
}

/**
 * Widget for symbol selection
 * PERFORMANCE OPTIMIZED: Memoized to prevent unnecessary re-renders
 */
const SymbolSelectorWidgetComponent = ({ symbol, onSymbolChange }: SymbolSelectorWidgetProps) => {
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSymbolChange(e.target.value.toUpperCase());
  }, [onSymbolChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }, []);

  return (
    <div className={styles.widget}>
      <input
        type="text"
        value={symbol}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Sembol (örn: BTCUSDT)"
        className={styles.input}
      />
      <div className={styles.buttons}>
        {POPULAR_SYMBOLS.slice(0, 5).map((sym) => {
          const isActive = symbol === sym;
          return (
            <button
              key={sym}
              onClick={() => onSymbolChange(sym)}
              className={`${styles.button} ${isActive ? styles.buttonActive : styles.buttonInactive}`}
              type="button"
            >
              {sym.replace('USDT', '')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const SymbolSelectorWidget = memo(SymbolSelectorWidgetComponent);
