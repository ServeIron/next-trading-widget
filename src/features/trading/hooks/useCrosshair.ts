/**
 * Custom hook for managing crosshair labels
 * PERFORMANCE OPTIMIZED: Uses refs + DOM manipulation instead of state
 * to avoid re-renders on every mouse movement
 */

import { useEffect, useRef } from 'react';
import type { IChartApi, ISeriesApi, MouseEventParams } from 'lightweight-charts';
import { CHART_CONFIG } from '../constants';

interface UseCrosshairOptions {
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick'> | null;
  container: HTMLElement | null;
  hasData: boolean;
  priceLabelRef: React.RefObject<HTMLDivElement>;
  timeLabelRef: React.RefObject<HTMLDivElement>;
  verticalLineRef: React.RefObject<HTMLDivElement>;
  horizontalLineRef: React.RefObject<HTMLDivElement>;
}

interface UseCrosshairReturn {
  // Only return visibility flags, not positions (positions managed via DOM)
  isVisible: boolean;
}

/**
 * Performance-optimized crosshair hook
 * Uses refs and direct DOM manipulation to avoid React re-renders
 */
export function useCrosshair({
  chart,
  series,
  container,
  hasData,
  priceLabelRef,
  timeLabelRef,
  verticalLineRef,
  horizontalLineRef,
}: UseCrosshairOptions): UseCrosshairReturn {
  const isVisibleRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!chart || !series || !container || !hasData || !priceLabelRef.current || !timeLabelRef.current || !verticalLineRef.current || !horizontalLineRef.current) {
      // Hide labels and lines
      if (priceLabelRef.current) {
        priceLabelRef.current.style.display = 'none';
      }
      if (timeLabelRef.current) {
        timeLabelRef.current.style.display = 'none';
      }
      if (verticalLineRef.current) {
        verticalLineRef.current.style.display = 'none';
      }
      if (horizontalLineRef.current) {
        horizontalLineRef.current.style.display = 'none';
      }
      isVisibleRef.current = false;
      return;
    }

    const priceLabel = priceLabelRef.current;
    const timeLabel = timeLabelRef.current;
    const verticalLine = verticalLineRef.current;
    const horizontalLine = horizontalLineRef.current;
    let mouseY: number | null = null;
    let mouseX: number | null = null;

    // Track mouse position (no state updates)
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseY = e.clientY - rect.top;
      mouseX = e.clientX - rect.left;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Throttled crosshair handler using requestAnimationFrame
    const crosshairHandler = (param: MouseEventParams) => {
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

        let calculatedPrice: number | null = null;
        let timeStr: string | null = null;
        let priceX = 0;
        let priceY = 0;
        let timeX = 0;
        let timeY = CHART_CONFIG.crosshairLabelTopOffset;

        // Removed debug logs for better performance

        // PRIMARY METHOD: Calculate price from mouse Y position (TradingView style)
        // This gives the exact price at the mouse cursor position, not just the bar's close price
        if (mouseY !== null) {
          try {
            const chartElement = chart.chartElement();
            if (chartElement) {
              const pricePane = chartElement.firstElementChild as HTMLElement;
              if (pricePane) {
                const paneRect = pricePane.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const relativeY = mouseY - (paneRect.top - containerRect.top);

                if (relativeY >= 0 && relativeY <= paneRect.height) {
                  // Use series coordinateToPrice method (Lightweight Charts 4.0+)
                  calculatedPrice = series.coordinateToPrice(relativeY);

                  if (calculatedPrice !== null && isFinite(calculatedPrice) && calculatedPrice > 0) {
                    // Position price label on the right side, aligned with price scale
                    // Price scale is on the right side of the chart
                    const containerRect = container.getBoundingClientRect();
                    // Position at right edge, label will be translated left by 100% (its own width)
                    // This places it just to the left of the price scale
                    priceX = containerRect.width - 4; // Small offset from right edge
                    priceY = mouseY; // Align with crosshair Y position
                  }
                }
              }
            }
          } catch (err) {
            // Chart might be disposed, ignore error
            if (err instanceof Error && !err.message.includes('disposed')) {
              console.warn('Crosshair price calculation error:', err);
            }
          }
        }

        // FALLBACK: Use param.point.y if mouseY calculation failed
        if (calculatedPrice === null && param.point && param.point.y !== undefined) {
          try {
            calculatedPrice = series.coordinateToPrice(param.point.y);

            if (calculatedPrice !== null && isFinite(calculatedPrice) && calculatedPrice > 0) {
              const containerRect = container.getBoundingClientRect();
              priceX = containerRect.width - CHART_CONFIG.crosshairLabelOffset;
              priceY = param.point.y;
            }
          } catch (err) {
            // Ignore errors
          }
        }

        // Calculate time from param
        if (param.time) {
          try {
            const timeValue = param.time as number;
            const date = new Date(timeValue * 1000);
            timeStr = date.toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });

            // Set time label position (top of chart, at mouse X)
            if (mouseX !== null) {
              timeX = mouseX;
            } else if (param.point && param.point.x !== undefined) {
              timeX = param.point.x;
            }
          } catch {
            // Ignore errors
          }
        }

        // Direct DOM manipulation (no React re-render)
        if (calculatedPrice !== null && isFinite(calculatedPrice) && calculatedPrice > 0) {
          // Format price with appropriate decimal places
          const formattedPrice = calculatedPrice >= 1 
            ? calculatedPrice.toFixed(2) 
            : calculatedPrice.toFixed(6);
          
          priceLabel.textContent = formattedPrice;
          priceLabel.style.display = 'block';
          priceLabel.style.left = `${priceX}px`;
          priceLabel.style.top = `${priceY}px`; // Align with crosshair Y position (transform will center it)
          isVisibleRef.current = true;
        } else {
          priceLabel.style.display = 'none';
        }

        if (timeStr !== null) {
          timeLabel.textContent = timeStr;
          timeLabel.style.display = 'block';
          timeLabel.style.left = `${timeX}px`;
          timeLabel.style.top = `${timeY}px`;
        } else {
          timeLabel.style.display = 'none';
        }

        // Update crosshair lines position (follow mouse)
        if (mouseX !== null && mouseY !== null) {
          try {
            const chartElement = chart.chartElement();
            if (chartElement) {
              const pricePane = chartElement.firstElementChild as HTMLElement;
              if (pricePane) {
                const paneRect = pricePane.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                // Calculate mouse position relative to container
                const containerMouseX = mouseX;
                const containerMouseY = mouseY;
                
                // Calculate pane position relative to container
                const paneLeft = paneRect.left - containerRect.left;
                const paneTop = paneRect.top - containerRect.top;
                
                // Check if mouse is within chart pane bounds
                const paneRelativeX = containerMouseX - paneLeft;
                const paneRelativeY = containerMouseY - paneTop;

                if (paneRelativeX >= 0 && paneRelativeX <= paneRect.width && 
                    paneRelativeY >= 0 && paneRelativeY <= paneRect.height) {
                  // Show and position vertical line (follows mouse X)
                  verticalLine.style.display = 'block';
                  verticalLine.style.left = `${containerMouseX}px`;
                  verticalLine.style.top = `${paneTop}px`;
                  verticalLine.style.height = `${paneRect.height}px`;

                  // Show and position horizontal line (follows mouse Y)
                  horizontalLine.style.display = 'block';
                  horizontalLine.style.left = `${paneLeft}px`;
                  horizontalLine.style.top = `${containerMouseY}px`;
                  horizontalLine.style.width = `${paneRect.width}px`;
                } else {
                  // Hide lines if mouse is outside chart pane
                  verticalLine.style.display = 'none';
                  horizontalLine.style.display = 'none';
                }
              }
            }
          } catch (err) {
            // Chart might be disposed, hide lines
            verticalLine.style.display = 'none';
            horizontalLine.style.display = 'none';
          }
        } else {
          // Hide lines if mouse position is not available
          verticalLine.style.display = 'none';
          horizontalLine.style.display = 'none';
        }
      });
    };

    try {
      chart.subscribeCrosshairMove(crosshairHandler);
    } catch (err) {
      // Chart might be disposed, ignore error
      console.warn('Failed to subscribe to crosshair (chart may be disposed):', err);
      return;
    }

    const handleMouseLeave = () => {
      // Hide labels and lines on mouse leave
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      priceLabel.style.display = 'none';
      timeLabel.style.display = 'none';
      if (verticalLine) verticalLine.style.display = 'none';
      if (horizontalLine) horizontalLine.style.display = 'none';
      isVisibleRef.current = false;
    };

    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      try {
        chart.unsubscribeCrosshairMove(crosshairHandler);
      } catch (err) {
        // Chart might be disposed, ignore error
        console.warn('Failed to unsubscribe from crosshair (chart may be disposed):', err);
      }
    };
  }, [chart, series, container, hasData, priceLabelRef, timeLabelRef, verticalLineRef, horizontalLineRef]);

  return {
    isVisible: isVisibleRef.current,
  };
}
