'use client';

import styles from './ErrorOverlay.module.css';

interface ErrorOverlayProps {
  error: Error;
  onRetry: () => void | Promise<void>;
}

export function ErrorOverlay({ error, onRetry }: ErrorOverlayProps) {
  const handleRetry = async () => {
    try {
      await onRetry();
    } catch (err) {
      console.error('Refetch error:', err);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.message}>Hata: {error.message}</div>
        <button className={styles.button} onClick={handleRetry} type="button">
          Yeniden Dene
        </button>
      </div>
    </div>
  );
}

