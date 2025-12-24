'use client';

import { memo } from 'react';
import styles from './LineAddWidget.module.css';

interface LineAddWidgetProps {
  isActive: boolean;
  onToggle: () => void;
}

/**
 * Widget for enabling/disabling line adding mode
 * PERFORMANCE OPTIMIZED: Memoized to prevent unnecessary re-renders
 */
const LineAddWidgetComponent = ({ isActive, onToggle }: LineAddWidgetProps) => {
  return (
    <div className={styles.widget}>
      <button
        className={`${styles.button} ${isActive ? styles.buttonActive : styles.buttonInactive}`}
        onClick={onToggle}
        type="button"
        title={isActive ? 'Çizgi ekleme modunu kapat' : 'Çizgi ekleme modunu aç (Grafikte tıklayarak çizgi ekleyin)'}
      >
        <span className={styles.icon}>{isActive ? '✓' : '+'}</span>
        <span className={styles.label}>Çizgi Ekle</span>
      </button>
    </div>
  );
};

export const LineAddWidget = memo(LineAddWidgetComponent);
