'use client';

import { memo } from 'react';
import styles from './CrosshairLabels.module.css';

interface CrosshairLabelsProps {
  priceLabelRef: React.RefObject<HTMLDivElement>;
  timeLabelRef: React.RefObject<HTMLDivElement>;
  verticalLineRef: React.RefObject<HTMLDivElement>;
  horizontalLineRef: React.RefObject<HTMLDivElement>;
}

/**
 * Performance-optimized CrosshairLabels component
 * Uses React.memo to prevent unnecessary re-renders
 * All label positions managed by useCrosshair hook via DOM manipulation
 */
const CrosshairLabelsComponent = ({
  priceLabelRef,
  timeLabelRef,
  verticalLineRef,
  horizontalLineRef,
}: CrosshairLabelsProps) => {

  return (
    <>
      {/* Vertical crosshair line - follows mouse X position */}
      <div ref={verticalLineRef} className={styles.verticalLine} style={{ display: 'none' }} />

      {/* Horizontal crosshair line - follows mouse Y position */}
      <div ref={horizontalLineRef} className={styles.horizontalLine} style={{ display: 'none' }} />

      {/* Price label - managed by useCrosshair hook via ref */}
      <div ref={priceLabelRef} className={styles.priceLabel} style={{ display: 'none' }} />

      {/* Time label - managed by useCrosshair hook via ref */}
      <div ref={timeLabelRef} className={styles.timeLabel} style={{ display: 'none' }} />
    </>
  );
};

// Memoize to prevent unnecessary re-renders
// This component never re-renders because all updates are via DOM manipulation
export const CrosshairLabels = memo(CrosshairLabelsComponent);
