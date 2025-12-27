/**
 * Custom hook for chart mouse interactions
 * PERFORMANCE OPTIMIZED: hoveredPrice in ref, only isHovering triggers re-render
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { IChartApi, MouseEventParams, ISeriesApi } from 'lightweight-charts';

interface UseChartMouseInteractionOptions {
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick' | 'Line'> | null;
  chartContainer: HTMLElement | null;
  chartContainerRef?: React.RefObject<HTMLElement | null>;
  enableLineAdding?: boolean;
  onAddLine?: (price: number) => void;
  hoveredPriceRef: React.RefObject<number | null>;
  mousePositionRef: React.RefObject<{ x: number; y: number } | null>;
}

interface UseChartMouseInteractionReturn {
  isHovering: boolean;
}

/**
 * Calculate price from mouse Y position relative to chart pane
 */
function calculatePriceFromMouseY(
  chart: IChartApi,
  series: ISeriesApi<'Candlestick' | 'Line'>,
  chartContainer: HTMLElement,
  mouseY: number
): number | null {
  try {
    const chartElement = chart.chartElement();
    if (!chartElement) return null;

    const pricePane = chartElement.firstElementChild as HTMLElement;
    if (!pricePane) return null;

    const paneRect = pricePane.getBoundingClientRect();
    const containerRect = chartContainer.getBoundingClientRect();
    const relativeY = mouseY - (paneRect.top - containerRect.top);

    if (relativeY < 0 || relativeY > paneRect.height) return null;

    // Use series coordinateToPrice method (Lightweight Charts 4.0+)
    const price = series.coordinateToPrice(relativeY);

    if (price !== null && isFinite(price) && price > 0) {
      return price;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Get price from series data (fallback method)
 */
function getPriceFromSeriesData(param: MouseEventParams): number | null {
  if (param.seriesData.size === 0) return null;

  for (const [, seriesData] of param.seriesData) {
    if (seriesData && typeof seriesData === 'object') {
      if ('close' in seriesData && typeof seriesData.close === 'number') {
        return seriesData.close;
      }
      if ('value' in seriesData && typeof seriesData.value === 'number') {
        return seriesData.value;
      }
    }
  }
  return null;
}

export function useChartMouseInteraction({
  chart,
  series,
  chartContainer,
  chartContainerRef,
  enableLineAdding = false,
  onAddLine,
  hoveredPriceRef,
  mousePositionRef,
}: UseChartMouseInteractionOptions): UseChartMouseInteractionReturn {
  // Only isHovering triggers re-render, hoveredPrice is in ref
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const onAddLineRef = useRef(onAddLine);
  const mouseYRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const previousHoveringStateRef = useRef<boolean>(false);

  // Keep callback ref updated
  useEffect(() => {
    onAddLineRef.current = onAddLine;
  }, [onAddLine]);

  // Get current container (prefer ref if provided, fallback to prop)
  const getCurrentContainer = (): HTMLElement | null => {
    return chartContainerRef?.current ?? chartContainer;
  };

  // Track mouse Y position from container (always active for crosshair)
  useEffect(() => {
    const currentContainer = getCurrentContainer();
    if (!currentContainer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = currentContainer.getBoundingClientRect();
      mouseYRef.current = e.clientY - rect.top;
      
      // Update mouse position ref (no re-render)
      if (mousePositionRef.current) {
        mousePositionRef.current.x = e.clientX;
        mousePositionRef.current.y = e.clientY;
      } else {
        mousePositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    currentContainer.addEventListener('mousemove', handleMouseMove);

    return () => {
      currentContainer.removeEventListener('mousemove', handleMouseMove);
    };
  }, [chartContainer, chartContainerRef, mousePositionRef]);

  // Subscribe to crosshair movement (throttled with RAF)
  // Always active to track price for crosshair label, regardless of line adding mode
  useEffect(() => {
    const currentContainer = getCurrentContainer();
    if (!chart || !series || !currentContainer) {
      setIsHovering(false);
      if (hoveredPriceRef.current !== null) {
        hoveredPriceRef.current = null;
      }
      return;
    }

    const handler = (param: MouseEventParams) => {
      // Check if chart is still valid before processing
      try {
        if (!chart || !chart.chartElement()) {
          return;
        }
      } catch (err) {
        // Chart is disposed, ignore
        return;
      }

      // Cancel previous RAF if exists
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        // Double-check chart is still valid inside RAF
        try {
          if (!chart || !chart.chartElement()) {
            return;
          }
        } catch (err) {
          // Chart is disposed, ignore
          return;
        }

        let price: number | null = null;

        // Primary method: Use mouse Y position from container
        if (mouseYRef.current !== null) {
          try {
            price = calculatePriceFromMouseY(chart, series, currentContainer, mouseYRef.current);
          } catch (err) {
            // Chart might be disposed, ignore
            return;
          }
        }

        // Fallback: use param.point.y for price
        if (price === null && param.point !== undefined) {
          try {
            price = series.coordinateToPrice(param.point.y);
            if (price === null || !isFinite(price) || price <= 0) {
              price = null;
            }
          } catch {
            // Ignore errors
          }
        }

        // Final fallback: try to get price from series data
        if (price === null) {
          price = getPriceFromSeriesData(param);
        }

        // Update ref (no re-render)
        hoveredPriceRef.current = price;

        // Only update state if hovering status changed (triggers re-render)
        const isCurrentlyHovering = price !== null && isFinite(price) && price > 0;
        if (isCurrentlyHovering !== previousHoveringStateRef.current) {
          previousHoveringStateRef.current = isCurrentlyHovering;
          setIsHovering(isCurrentlyHovering);
        }
      });
    };

    try {
      chart.subscribeCrosshairMove(handler);
    } catch (err) {
      // Chart might be disposed, ignore error
      console.warn('Failed to subscribe to crosshair move (chart may be disposed):', err);
      return;
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      try {
        chart.unsubscribeCrosshairMove(handler);
      } catch (err) {
        // Chart might be disposed, ignore error
        console.warn('Failed to unsubscribe from crosshair move (chart may be disposed):', err);
      }
    };
  }, [chart, series, chartContainer, chartContainerRef, hoveredPriceRef]);

  // Handle click to add line (only when line adding mode is enabled)
  // Note: Line clicks are handled first by useChartLineInteraction (capture phase)
  const handleClick = useCallback(
    (event: MouseEvent) => {
      const currentContainer = getCurrentContainer();
      // Only process clicks when line adding is enabled
      if (!enableLineAdding || !chart || !series || !currentContainer || !onAddLineRef.current) return;
      
      // Check if event was stopped by line click handler
      if (event.defaultPrevented || !event.isTrusted) return;

      let price: number | null = null;

      // First try: Use hoveredPrice from ref (most reliable)
      if (hoveredPriceRef.current !== null && isFinite(hoveredPriceRef.current) && hoveredPriceRef.current > 0) {
        price = hoveredPriceRef.current;
      } else {
        // Second try: Calculate from click Y position using container
        if (mouseYRef.current !== null) {
          price = calculatePriceFromMouseY(chart, series, currentContainer, mouseYRef.current);
        }

        // Third try: Calculate from click event clientY
        if (price === null) {
          try {
            const chartElement = chart.chartElement();
            if (chartElement) {
              const pricePane = chartElement.firstElementChild as HTMLElement;
              if (pricePane) {
                const paneRect = pricePane.getBoundingClientRect();
                const containerRect = currentContainer.getBoundingClientRect();
                const clickY = event.clientY;
                const relativeY = clickY - paneRect.top;

                if (relativeY >= 0 && relativeY <= paneRect.height) {
                  price = series.coordinateToPrice(relativeY);
                }
              }
            }
          } catch (err) {
            console.error('Error calculating price from click:', err);
          }
        }

        // Fourth try: Use container-relative Y position
        if (price === null && currentContainer) {
          try {
            const containerRect = currentContainer.getBoundingClientRect();
            const clickY = event.clientY;
            const relativeY = clickY - containerRect.top;
            price = calculatePriceFromMouseY(chart, series, currentContainer, relativeY);
          } catch (err) {
            console.error('Error calculating price from container:', err);
          }
        }
      }

      // Add line if we have a valid price
      if (price !== null && isFinite(price) && price > 0 && onAddLineRef.current) {
        onAddLineRef.current(price);
      }
    },
    [chart, series, chartContainer, chartContainerRef, enableLineAdding, hoveredPriceRef]
  );

  useEffect(() => {
    if (!chart || !enableLineAdding || !onAddLineRef.current) return;

    let container: HTMLElement | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const setupClickListener = () => {
      container = chart.chartElement();
      if (container) {
        container.addEventListener('click', handleClick, { passive: true });
      } else {
        // Retry after a short delay if chart element is not ready
        timeoutId = setTimeout(() => {
          setupClickListener();
        }, 100);
      }
    };

    setupClickListener();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (container) {
        container.removeEventListener('click', handleClick);
      }
    };
  }, [chart, enableLineAdding, handleClick]);

  return {
    isHovering,
  };
}
