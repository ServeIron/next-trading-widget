/**
 * Custom hook for managing horizontal price lines
 */

import { useEffect, useRef } from 'react';
import { LineStyle, type ISeriesApi, type IPriceLine } from 'lightweight-charts';
import type { HorizontalLineConfig } from '../types/lines';

interface UseChartLinesOptions {
  series: ISeriesApi<'Candlestick'> | null;
  horizontalLines: HorizontalLineConfig[];
  hasData: boolean;
}

const getLineStyle = (style: string): LineStyle => {
  switch (style) {
    case 'dashed':
      return LineStyle.Dashed;
    case 'dotted':
      return LineStyle.Dotted;
    default:
      return LineStyle.Solid;
  }
};

export function useChartLines({
  series,
  horizontalLines,
  hasData,
}: UseChartLinesOptions): void {
  const priceLinesRef = useRef<Map<string, IPriceLine>>(new Map());
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const pendingLinesRef = useRef<HorizontalLineConfig[]>([]);

  // Track series changes and preserve lines
  useEffect(() => {
    if (seriesRef.current !== series && seriesRef.current !== null) {
      // Series changed (e.g., interval change), clear old lines from old series
      if (priceLinesRef.current.size > 0) {
        priceLinesRef.current.forEach((priceLine) => {
          try {
            seriesRef.current?.removePriceLine(priceLine);
          } catch {
            // Series might be disposed, ignore
          }
        });
        priceLinesRef.current.clear();
      }
      
      // Store current lines to recreate when new series has data
      if (horizontalLines.length > 0) {
        pendingLinesRef.current = [...horizontalLines];
      }
    }
    
    seriesRef.current = series;
  }, [series]);

  useEffect(() => {
    if (!series) {
      // No series yet, wait
      return;
    }

    // Wait for data to be available before rendering lines
    // This ensures price scale is properly initialized
    if (!hasData) {
      return;
    }

    // Remove lines that are no longer in the list
    const currentLineIds = new Set(horizontalLines.map((line) => line.id));
    priceLinesRef.current.forEach((priceLine, id) => {
      if (!currentLineIds.has(id)) {
        try {
          series.removePriceLine(priceLine);
          priceLinesRef.current.delete(id);
        } catch (err) {
          // Series might be disposed, ignore error
          console.warn('Failed to remove price line (series may be disposed):', err);
          priceLinesRef.current.delete(id);
        }
      }
    });

    // Use pending lines if available (after series change), otherwise use current lines
    const linesToRender = pendingLinesRef.current.length > 0 
      ? pendingLinesRef.current 
      : horizontalLines;

    // Clear pending lines once we've rendered them
    if (pendingLinesRef.current.length > 0) {
      pendingLinesRef.current = [];
    }

    // Add or update lines
    linesToRender.forEach((lineConfig) => {
      const existingLine = priceLinesRef.current.get(lineConfig.id);

      if (existingLine) {
        try {
          // Update existing line - remove old one
          series.removePriceLine(existingLine);
        } catch (err) {
          // Series might be disposed, ignore error
          console.warn('Failed to remove existing price line (series may be disposed):', err);
        }
      }

      // Create new price line object
      try {
        const priceLine = {
          price: lineConfig.price,
          color: lineConfig.color,
          lineWidth: lineConfig.lineWidth as number,
          lineStyle: getLineStyle(lineConfig.lineStyle),
          axisLabelVisible: lineConfig.labelVisible !== false,
          title: lineConfig.label || lineConfig.price.toFixed(2),
        };

        const createdPriceLine = series.createPriceLine(priceLine);
        if (createdPriceLine) {
          priceLinesRef.current.set(lineConfig.id, createdPriceLine);
        }
      } catch (err) {
        // Series might be disposed, ignore error
        console.warn('Failed to create price line (series may be disposed):', err);
      }
    });
  }, [series, horizontalLines, hasData]);
}

