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
  tooltipRef: React.RefObject<HTMLDivElement>;
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
  tooltipRef,
}: UseCrosshairOptions): UseCrosshairReturn {
  const isVisibleRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!chart || !series || !container || !hasData || !priceLabelRef.current || !timeLabelRef.current || !tooltipRef.current) {
      // Hide labels
      if (priceLabelRef.current) {
        priceLabelRef.current.style.display = 'none';
      }
      if (timeLabelRef.current) {
        timeLabelRef.current.style.display = 'none';
      }
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
      isVisibleRef.current = false;
      return;
    }

    const priceLabel = priceLabelRef.current;
    const timeLabel = timeLabelRef.current;
    const tooltip = tooltipRef.current;
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
      // Cancel previous RAF if exists
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        let calculatedPrice: number | null = null;
        let timeStr: string | null = null;
        let priceX = 0;
        let priceY = 0;
        let timeX = 0;
        let timeY = CHART_CONFIG.crosshairLabelTopOffset;

        console.log('[Crosshair] param received:', {
          hasSeriesData: param.seriesData?.size > 0,
          seriesDataSize: param.seriesData?.size || 0,
          hasPoint: !!param.point,
          point: param.point,
          hasTime: !!param.time,
          time: param.time,
        });

        // PRIMARY METHOD: Get price from seriesData (most reliable)
        if (param.seriesData && param.seriesData.size > 0) {
          console.log('[Crosshair] Processing seriesData, size:', param.seriesData.size);
          for (const [series, seriesData] of param.seriesData) {
            console.log('[Crosshair] Series data:', { series: series?.seriesType(), data: seriesData });
            if (seriesData && typeof seriesData === 'object') {
              if ('close' in seriesData && typeof seriesData.close === 'number') {
                calculatedPrice = seriesData.close;
                console.log('[Crosshair] Found price from close:', calculatedPrice);
                break;
              }
              if ('value' in seriesData && typeof seriesData.value === 'number') {
                calculatedPrice = seriesData.value;
                console.log('[Crosshair] Found price from value:', calculatedPrice);
                break;
              }
            }
          }

          // Set priceX and priceY when we have price from seriesData
          if (calculatedPrice !== null) {
            const containerRect = container.getBoundingClientRect();
            
            // Use param.point.y if available, otherwise use mouseY
            if (param.point && param.point.y !== undefined) {
              priceY = param.point.y;
              priceX = containerRect.width - CHART_CONFIG.crosshairLabelOffset;
              console.log('[Crosshair] Using param.point for position:', { priceX, priceY });
            } else if (mouseY !== null) {
              priceY = mouseY;
              priceX = containerRect.width - CHART_CONFIG.crosshairLabelOffset;
              console.log('[Crosshair] Using mouseY for position:', { priceX, priceY });
            }
          }
        } else {
          console.log('[Crosshair] No seriesData available');
        }

        // FALLBACK: Calculate price from mouse Y position
        if (calculatedPrice === null && mouseY !== null) {
          try {
            const chartElement = chart.chartElement();
            if (chartElement) {
              const pricePane = chartElement.firstElementChild as HTMLElement;
              if (pricePane) {
                const paneRect = pricePane.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const relativeY = mouseY - (paneRect.top - containerRect.top);

                if (relativeY >= 0 && relativeY <= paneRect.height) {
                  // Use chart's price scale coordinateToPrice method
                  const priceScale = chart.priceScale('right');
                  if (priceScale && typeof (priceScale as { coordinateToPrice?: (y: number) => number | null }).coordinateToPrice === 'function') {
                    calculatedPrice = (priceScale as { coordinateToPrice: (y: number) => number | null }).coordinateToPrice(relativeY);
                  }

                  if (calculatedPrice !== null && isFinite(calculatedPrice) && calculatedPrice > 0) {
                    priceX = containerRect.width - CHART_CONFIG.crosshairLabelOffset;
                    priceY = mouseY;
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

        // FINAL FALLBACK: Use param.point.y if available
        if (calculatedPrice === null && param.point) {
          try {
            const containerRect = container.getBoundingClientRect();
            priceX = containerRect.width - CHART_CONFIG.crosshairLabelOffset;
            priceY = param.point.y;
            
            // Try to get price from series data at this point
            if (param.seriesData && param.seriesData.size > 0) {
              for (const [, seriesData] of param.seriesData) {
                if (seriesData && typeof seriesData === 'object') {
                  if ('close' in seriesData && typeof seriesData.close === 'number') {
                    calculatedPrice = seriesData.close;
                    break;
                  }
                }
              }
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
        console.log('[Crosshair] Final calculatedPrice:', calculatedPrice, 'priceX:', priceX, 'priceY:', priceY);
        
        if (calculatedPrice !== null && isFinite(calculatedPrice) && calculatedPrice > 0) {
          console.log('[Crosshair] Setting price label, price:', calculatedPrice.toFixed(2));
          priceLabel.textContent = calculatedPrice.toFixed(2);
          priceLabel.style.display = 'block';
          priceLabel.style.left = `${priceX}px`;
          priceLabel.style.top = `${priceY - CHART_CONFIG.crosshairLabelTopOffset}px`;
          isVisibleRef.current = true;

          // Update tooltip position (next to price label, at the junction of chart and price scale)
          if (tooltip) {
            const containerRect = container.getBoundingClientRect();
            // Position tooltip at the junction: left of price label (chart side)
            // Price label is at: containerRect.left + priceX (relative to container)
            // Tooltip uses fixed positioning, so we need absolute coordinates
            // Position tooltip at price label's left edge, then translate left by 100% (its own width)
            const tooltipX = containerRect.left + priceX;
            const tooltipY = containerRect.top + priceY - CHART_CONFIG.crosshairLabelTopOffset;

            console.log('[Crosshair] Setting tooltip:', {
              tooltipExists: !!tooltip,
              tooltipX,
              tooltipY,
              containerRect: { left: containerRect.left, top: containerRect.top, width: containerRect.width },
              priceX,
              priceY,
              calculatedPrice,
            });

            // Ensure tooltip is visible
            tooltip.style.display = 'flex';
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
            tooltip.style.left = `${tooltipX}px`;
            tooltip.style.top = `${tooltipY}px`;
            tooltip.style.transform = 'translateX(-100%) translateY(-50%)';
            tooltip.style.zIndex = '1001';

            // Update price text
            const priceText = tooltip.querySelector('span:last-child');
            if (priceText) {
              priceText.textContent = calculatedPrice.toFixed(2);
              console.log('[Crosshair] Tooltip price text updated to:', calculatedPrice.toFixed(2));
            } else {
              console.warn('[Crosshair] Price text span not found in tooltip!');
            }

            // Verify tooltip is actually visible
            const computedStyle = window.getComputedStyle(tooltip);
            console.log('[Crosshair] Tooltip computed styles:', {
              display: computedStyle.display,
              visibility: computedStyle.visibility,
              opacity: computedStyle.opacity,
              left: computedStyle.left,
              top: computedStyle.top,
              transform: computedStyle.transform,
              zIndex: computedStyle.zIndex,
            });
          } else {
            console.warn('[Crosshair] Tooltip element is null!');
          }
        } else {
          console.log('[Crosshair] No valid price, hiding labels');
          priceLabel.style.display = 'none';
          if (tooltip) {
            tooltip.style.display = 'none';
            tooltip.style.visibility = 'hidden';
          }
        }

        if (timeStr !== null) {
          timeLabel.textContent = timeStr;
          timeLabel.style.display = 'block';
          timeLabel.style.left = `${timeX}px`;
          timeLabel.style.top = `${timeY}px`;
        } else {
          timeLabel.style.display = 'none';
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
      // Hide labels on mouse leave
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      priceLabel.style.display = 'none';
      timeLabel.style.display = 'none';
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
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
  }, [chart, series, container, hasData, priceLabelRef, timeLabelRef, tooltipRef]);

  return {
    isVisible: isVisibleRef.current,
  };
}
