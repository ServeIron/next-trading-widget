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

  useEffect(() => {
    if (!series || !hasData) return;

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

    // Add or update lines
    horizontalLines.forEach((lineConfig) => {
      const existingLine = priceLinesRef.current.get(lineConfig.id);

      if (existingLine) {
        try {
          // Update existing line
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

