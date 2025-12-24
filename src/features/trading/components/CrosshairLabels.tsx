'use client';

import { memo } from 'react';
import styles from './CrosshairLabels.module.css';

interface CrosshairLabelsProps {
  priceLabelRef: React.RefObject<HTMLDivElement>;
  timeLabelRef: React.RefObject<HTMLDivElement>;
  tooltipRef: React.RefObject<HTMLDivElement>;
}

/**
 * Performance-optimized CrosshairLabels component
 * Uses React.memo to prevent unnecessary re-renders
 * All label positions managed by useCrosshair hook via DOM manipulation
 */
const CrosshairLabelsComponent = ({
  priceLabelRef,
  timeLabelRef,
  tooltipRef,
}: CrosshairLabelsProps) => {

  return (
    <>
      {/* Price label - managed by useCrosshair hook via ref */}
      <div ref={priceLabelRef} className={styles.priceLabel} style={{ display: 'none' }} />

      {/* Time label - managed by useCrosshair hook via ref */}
      <div ref={timeLabelRef} className={styles.timeLabel} style={{ display: 'none' }} />

      {/* Tooltip - always visible, managed by useCrosshair hook via ref */}
      <div ref={tooltipRef} className={styles.tooltip} style={{ display: 'none', visibility: 'hidden' }}>
        <span className={styles.tooltipIcon}>+</span>
        <span>0.00</span>
      </div>
    </>
  );
};

// Memoize to prevent unnecessary re-renders
// This component never re-renders because all updates are via DOM manipulation
export const CrosshairLabels = memo(CrosshairLabelsComponent);
