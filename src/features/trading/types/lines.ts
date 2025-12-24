/**
 * Horizontal Line Type Definitions
 */

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface HorizontalLineConfig {
  id: string;
  price: number;
  color: string;
  lineWidth: number;
  lineStyle: LineStyle;
  label?: string;
  labelVisible?: boolean;
}

