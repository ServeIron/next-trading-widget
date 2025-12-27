/**
 * Custom hook for measuring container dimensions
 * PERFORMANCE OPTIMIZED: Uses ResizeObserver for efficient size tracking
 * 
 * This hook enables plug-and-play functionality by allowing the chart module
 * to automatically adapt to its parent container's dimensions.
 */

import { useEffect, useState, useRef } from 'react';

interface UseContainerSizeOptions {
  /**
   * Reference to the container element to measure
   */
  containerRef: React.RefObject<HTMLElement | null>;
  
  /**
   * Optional: Header height to subtract from container height
   * Used when calculating available chart height
   * @default 0
   */
  headerHeight?: number;
  
  /**
   * Optional: Minimum height threshold
   * If calculated height is below this, returns this value
   * @default 300
   */
  minHeight?: number;
}

interface UseContainerSizeReturn {
  /**
   * Current width of the container in pixels
   */
  width: number;
  
  /**
   * Current height of the container in pixels (after subtracting headerHeight)
   */
  height: number;
  
  /**
   * Whether the container is currently being measured
   * Useful for showing loading states during initial measurement
   */
  isMeasuring: boolean;
}

/**
 * Custom hook that measures container dimensions using ResizeObserver
 * 
 * @param options - Configuration options for container size measurement
 * @returns Object containing width, height, and measurement state
 * 
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { width, height } = useContainerSize({
 *   containerRef,
 *   headerHeight: 60,
 *   minHeight: 300,
 * });
 * ```
 */
export function useContainerSize({
  containerRef,
  headerHeight = 0,
  minHeight = 300,
}: UseContainerSizeOptions): UseContainerSizeReturn {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [isMeasuring, setIsMeasuring] = useState<boolean>(true);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      setIsMeasuring(false);
      return;
    }

    // Initial measurement
    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      const calculatedHeight = Math.max(minHeight, rect.height - headerHeight);
      
      setDimensions({
        width: rect.width,
        height: calculatedHeight,
      });
      setIsMeasuring(false);
    };

    // Perform initial measurement
    updateDimensions();

    // Set up ResizeObserver for responsive updates
    resizeObserverRef.current = new ResizeObserver((entries) => {
      if (entries.length === 0) return;
      
      const entry = entries[0];
      if (entry.target !== container) return;

      const rect = entry.contentRect;
      const calculatedHeight = Math.max(minHeight, rect.height - headerHeight);
      
      setDimensions({
        width: rect.width,
        height: calculatedHeight,
      });
    });

    resizeObserverRef.current.observe(container);

    // Cleanup
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [containerRef, headerHeight, minHeight]);

  return {
    width: dimensions.width,
    height: dimensions.height,
    isMeasuring,
  };
}

