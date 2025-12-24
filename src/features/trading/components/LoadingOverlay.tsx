'use client';

import styles from './LoadingOverlay.module.css';

interface LoadingOverlayProps {
  onRetry?: () => void | Promise<void>;
}

export function LoadingOverlay({ onRetry }: LoadingOverlayProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.message}>Yükleniyor...</div>
        {onRetry && (
          <button className={styles.button} onClick={onRetry} type="button">
            Yeniden Dene
          </button>
        )}
      </div>
    </div>
  );
}

