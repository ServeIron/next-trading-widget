/**
 * Indicator Type Definitions
 */

export type IndicatorType = 'MA' | 'EMA' | 'RSI' | 'MACD' | 'BB';

export interface IndicatorConfig {
  type: IndicatorType;
  period?: number;
  color?: string;
  lineWidth?: number;
}

export interface MAConfig extends IndicatorConfig {
  type: 'MA';
  period: number; // 5, 10, 20, 50, 100, 200
}

export interface EMAConfig extends IndicatorConfig {
  type: 'EMA';
  period: number; // 9, 12, 26, 50
}

export interface RSIConfig extends IndicatorConfig {
  type: 'RSI';
  period: number; // 14 (default)
}

export interface MACDConfig extends IndicatorConfig {
  type: 'MACD';
  fastPeriod?: number; // 12 (default)
  slowPeriod?: number; // 26 (default)
  signalPeriod?: number; // 9 (default)
}

export interface BBConfig extends IndicatorConfig {
  type: 'BB';
  period: number; // 20 (default)
  stdDev?: number; // 2 (default)
}

export type IndicatorConfigUnion = MAConfig | EMAConfig | RSIConfig | MACDConfig | BBConfig;

export interface IndicatorDataPoint {
  time: number;
  value: number;
}

export interface IndicatorSeries {
  config: IndicatorConfigUnion;
  data: IndicatorDataPoint[];
}

