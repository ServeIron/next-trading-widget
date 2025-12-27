/**
 * Custom hook for detecting clicks on horizontal price lines
 * PERFORMANCE OPTIMIZED: Uses refs and efficient price matching
 */

import { useEffect, useRef, useCallback } from 'react';
import type { IChartApi, ISeriesApi, MouseEventParams } from 'lightweight-charts';
import type { HorizontalLineConfig } from '../types/lines';

interface UseChartLineInteractionOptions {
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick'> | null;
  chartContainer: HTMLElement | null;
  chartContainerRef?: React.RefObject<HTMLElement | null>;
  horizontalLines: HorizontalLineConfig[];
  hasData: boolean;
  onLineClick?: (lineId: string, price: number, event: MouseEvent) => void;
  onLineHover?: (isHovering: boolean) => void;
}

interface UseChartLineInteractionReturn {
  isHoveringLine: boolean;
}

/**
 * Tolerance for hover detection (in pixels)
 * More strict for hover to avoid interfering with line adding
 */
const HOVER_TOLERANCE_PX = 5; // 5px tolerance for hover (tight)

/**
 * Tolerance for click detection (in pixels)
 * Slightly more lenient for clicks
 */
const CLICK_TOLERANCE_PX = 10; // 10px tolerance for click

/**
 * Calculate price from mouse Y position
 */
function getPriceFromMouseY(
  chart: IChartApi,
  series: ISeriesApi<'Candlestick'>,
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

    const price = series.coordinateToPrice(relativeY);
    return price !== null && isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

/**
 * Convert price difference to pixel difference
 */
function priceToPixel(
  chart: IChartApi,
  series: ISeriesApi<'Candlestick'>,
  price1: number,
  price2: number
): number | null {
  try {
    const coord1 = series.priceToCoordinate(price1);
    const coord2 = series.priceToCoordinate(price2);
    if (coord1 === null || coord2 === null) return null;
    return Math.abs(coord1 - coord2);
  } catch {
    return null;
  }
}

/**
 * Find the closest line to a given price (for hover - strict)
 */
function findClosestLineForHover(
  chart: IChartApi,
  series: ISeriesApi<'Candlestick'>,
  horizontalLines: HorizontalLineConfig[],
  hoveredPrice: number
): HorizontalLineConfig | null {
  if (horizontalLines.length === 0) return null;

  let closestLine: HorizontalLineConfig | null = null;
  let minPixelDistance = Infinity;

  for (const line of horizontalLines) {
    const pixelDistance = priceToPixel(chart, series, line.price, hoveredPrice);
    if (pixelDistance !== null && pixelDistance <= HOVER_TOLERANCE_PX && pixelDistance < minPixelDistance) {
      minPixelDistance = pixelDistance;
      closestLine = line;
    }
  }

  return closestLine;
}

/**
 * Find the closest line to a given price (for click - more lenient)
 */
function findClosestLineForClick(
  chart: IChartApi,
  series: ISeriesApi<'Candlestick'>,
  horizontalLines: HorizontalLineConfig[],
  clickedPrice: number
): HorizontalLineConfig | null {
  if (horizontalLines.length === 0) return null;

  let closestLine: HorizontalLineConfig | null = null;
  let minPixelDistance = Infinity;

  for (const line of horizontalLines) {
    const pixelDistance = priceToPixel(chart, series, line.price, clickedPrice);
    if (pixelDistance !== null && pixelDistance <= CLICK_TOLERANCE_PX && pixelDistance < minPixelDistance) {
      minPixelDistance = pixelDistance;
      closestLine = line;
    }
  }

  return closestLine;
}

/**
 * Custom hook for detecting clicks on horizontal price lines
 */
export function useChartLineInteraction({
  chart,
  series,
  chartContainer,
  chartContainerRef,
  horizontalLines,
  hasData,
  onLineClick,
  onLineHover,
}: UseChartLineInteractionOptions): UseChartLineInteractionReturn {
  const onLineClickRef = useRef(onLineClick);
  const onLineHoverRef = useRef(onLineHover);
  const mouseYRef = useRef<number | null>(null);
  const isHoveringLineRef = useRef<boolean>(false);

  // Keep callback refs updated
  useEffect(() => {
    onLineClickRef.current = onLineClick;
  }, [onLineClick]);

  useEffect(() => {
    onLineHoverRef.current = onLineHover;
  }, [onLineHover]);

  // Get current container (prefer ref if provided, fallback to prop)
  const getCurrentContainer = (): HTMLElement | null => {
    return chartContainerRef?.current ?? chartContainer;
  };

  // Track mouse Y position for click detection and hover
  useEffect(() => {
    const currentContainer = getCurrentContainer();
    if (!chart || !series || !currentContainer || !hasData) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = currentContainer.getBoundingClientRect();
      mouseYRef.current = e.clientY - rect.top;

      // Check if hovering over a line (strict tolerance)
      const hoveredPrice = getPriceFromMouseY(chart, series, currentContainer, mouseYRef.current);
      if (hoveredPrice !== null && isFinite(hoveredPrice) && hoveredPrice > 0) {
        const closestLine = findClosestLineForHover(chart, series, horizontalLines, hoveredPrice);
        const isHovering = closestLine !== null;

        if (isHovering !== isHoveringLineRef.current) {
          isHoveringLineRef.current = isHovering;
          if (onLineHoverRef.current) {
            onLineHoverRef.current(isHovering);
          }
        }
      } else {
        if (isHoveringLineRef.current) {
          isHoveringLineRef.current = false;
          if (onLineHoverRef.current) {
            onLineHoverRef.current(false);
          }
        }
      }
    };

    currentContainer.addEventListener('mousemove', handleMouseMove);

    return () => {
      currentContainer.removeEventListener('mousemove', handleMouseMove);
    };
  }, [chart, series, chartContainer, chartContainerRef, horizontalLines, hasData]);

  // Handle click to detect line clicks
  const handleClick = useCallback(
    (event: MouseEvent) => {
      const currentContainer = getCurrentContainer();
      if (!chart || !series || !currentContainer || !hasData || !onLineClickRef.current) return;

      // Check if chart is still valid
      try {
        if (!chart.chartElement()) return;
      } catch {
        return;
      }

      // Calculate price from click position
      let clickedPrice: number | null = null;

      // First try: Use mouse Y position from ref
      if (mouseYRef.current !== null) {
        clickedPrice = getPriceFromMouseY(chart, series, currentContainer, mouseYRef.current);
      }

      // Second try: Calculate from click event clientY
      if (clickedPrice === null) {
        try {
          const chartElement = chart.chartElement();
          if (chartElement) {
            const pricePane = chartElement.firstElementChild as HTMLElement;
            if (pricePane) {
              const paneRect = pricePane.getBoundingClientRect();
              const clickY = event.clientY;
              const relativeY = clickY - paneRect.top;

              if (relativeY >= 0 && relativeY <= paneRect.height) {
                clickedPrice = series.coordinateToPrice(relativeY);
              }
            }
          }
        } catch {
          // Ignore errors
        }
      }

      // If we have a valid price, check if it matches any line (more lenient tolerance for click)
      if (clickedPrice !== null && isFinite(clickedPrice) && clickedPrice > 0) {
        const closestLine = findClosestLineForClick(chart, series, horizontalLines, clickedPrice);

        if (closestLine && onLineClickRef.current) {
          // Prevent default behavior and stop propagation to prevent line adding
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          onLineClickRef.current(closestLine.id, closestLine.price, event);
          return; // Early return to prevent further processing
        }
      }
    },
    [chart, series, chartContainer, chartContainerRef, horizontalLines, hasData]
  );

  // Add click listener to chart
  useEffect(() => {
    if (!chart || !hasData || !onLineClickRef.current) return;

    // Wait for chart element to be ready
    let container: HTMLElement | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const setupClickListener = () => {
      try {
        container = chart.chartElement();
        if (container) {
          // Use capture phase to handle line clicks before other click handlers
          container.addEventListener('click', handleClick, { passive: false, capture: true });
        } else {
          // Retry after a short delay if chart element is not ready
          timeoutId = setTimeout(() => {
            setupClickListener();
          }, 100);
        }
      } catch {
        // Chart might be disposed, ignore
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
  }, [chart, hasData, handleClick]);

  return {
    isHoveringLine: isHoveringLineRef.current,
  };
}

