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

    const priceScale = series.priceScale();
    const price = (priceScale as { coordinateToPrice: (y: number) => number | null }).coordinateToPrice(relativeY);

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

  // Track mouse Y position from container (always active for crosshair)
  useEffect(() => {
    if (!chartContainer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = chartContainer.getBoundingClientRect();
      mouseYRef.current = e.clientY - rect.top;
      
      // Update mouse position ref (no re-render)
      if (mousePositionRef.current) {
        mousePositionRef.current.x = e.clientX;
        mousePositionRef.current.y = e.clientY;
      } else {
        mousePositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    chartContainer.addEventListener('mousemove', handleMouseMove);

    return () => {
      chartContainer.removeEventListener('mousemove', handleMouseMove);
    };
  }, [chartContainer, mousePositionRef]);

  // Subscribe to crosshair movement (throttled with RAF)
  // Always active to track price for crosshair label, regardless of line adding mode
  useEffect(() => {
    if (!chart || !series || !chartContainer) {
      setIsHovering(false);
      if (hoveredPriceRef.current !== null) {
        hoveredPriceRef.current = null;
      }
      return;
    }

    const handler = (param: MouseEventParams) => {
      // Cancel previous RAF if exists
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        let price: number | null = null;

        // Primary method: Use mouse Y position from container
        if (mouseYRef.current !== null) {
          price = calculatePriceFromMouseY(chart, series, chartContainer, mouseYRef.current);
        }

        // Fallback: use param.point.y for price
        if (price === null && param.point !== undefined) {
          try {
            const priceScale = series.priceScale();
            price = (priceScale as { coordinateToPrice: (y: number) => number | null }).coordinateToPrice(param.point.y);
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
  }, [chart, series, chartContainer, hoveredPriceRef]);

  // Handle click to add line (only when line adding mode is enabled)
  const handleClick = useCallback(
    (event: MouseEvent) => {
      // Only process clicks when line adding is enabled
      if (!enableLineAdding || !chart || !series || !chartContainer || !onAddLineRef.current) return;

      let price: number | null = null;

      // First try: Use hoveredPrice from ref (most reliable)
      if (hoveredPriceRef.current !== null && isFinite(hoveredPriceRef.current) && hoveredPriceRef.current > 0) {
        price = hoveredPriceRef.current;
      } else {
        // Second try: Calculate from click Y position using container
        if (mouseYRef.current !== null) {
          price = calculatePriceFromMouseY(chart, series, chartContainer, mouseYRef.current);
        }

        // Third try: Calculate from click event clientY
        if (price === null) {
          try {
            const chartElement = chart.chartElement();
            if (chartElement) {
              const pricePane = chartElement.firstElementChild as HTMLElement;
              if (pricePane) {
                const paneRect = pricePane.getBoundingClientRect();
                const containerRect = chartContainer.getBoundingClientRect();
                const clickY = event.clientY;
                const relativeY = clickY - paneRect.top;

                if (relativeY >= 0 && relativeY <= paneRect.height) {
                  const priceScale = series.priceScale();
                  price = (priceScale as { coordinateToPrice: (y: number) => number | null }).coordinateToPrice(relativeY);
                }
              }
            }
          } catch (err) {
            console.error('Error calculating price from click:', err);
          }
        }

        // Fourth try: Use container-relative Y position
        if (price === null && chartContainer) {
          try {
            const containerRect = chartContainer.getBoundingClientRect();
            const clickY = event.clientY;
            const relativeY = clickY - containerRect.top;
            price = calculatePriceFromMouseY(chart, series, chartContainer, relativeY);
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
    [chart, series, chartContainer, enableLineAdding, hoveredPriceRef]
  );

  useEffect(() => {
    if (!chart || !enableLineAdding || !onAddLineRef.current) return;

    const container = chart.chartElement();
    if (!container) return;

    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [chart, enableLineAdding, handleClick]);

  return {
    isHovering,
  };
}
