/**
 * Technical Indicator Calculations
 */

import type { BinanceKline } from '../types/binance';
import type { IndicatorDataPoint, IndicatorConfigUnion, MAConfig, EMAConfig, RSIConfig } from '../types/indicators';

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateMA(
  data: BinanceKline[],
  period: number,
  priceKey: 'close' | 'open' | 'high' | 'low' = 'close'
): IndicatorDataPoint[] {
  if (data.length < period) return [];

  const result: IndicatorDataPoint[] = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j][priceKey];
    }
    const average = sum / period;
    result.push({
      time: data[i].time,
      value: average,
    });
  }

  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(
  data: BinanceKline[],
  period: number,
  priceKey: 'close' | 'open' | 'high' | 'low' = 'close'
): IndicatorDataPoint[] {
  if (data.length < period) return [];

  const result: IndicatorDataPoint[] = [];
  const multiplier = 2 / (period + 1);

  // First EMA value is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i][priceKey];
  }
  let ema = sum / period;
  result.push({
    time: data[period - 1].time,
    value: ema,
  });

  // Calculate subsequent EMA values
  for (let i = period; i < data.length; i++) {
    ema = (data[i][priceKey] - ema) * multiplier + ema;
    result.push({
      time: data[i].time,
      value: ema,
    });
  }

  return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(data: BinanceKline[], period: number = 14): IndicatorDataPoint[] {
  if (data.length < period + 1) return [];

  const result: IndicatorDataPoint[] = [];
  const changes: number[] = [];

  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close);
  }

  // Calculate initial average gain and loss
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // Calculate RSI for first period
  if (avgLoss === 0) {
    result.push({
      time: data[period].time,
      value: 100,
    });
  } else {
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    result.push({
      time: data[period].time,
      value: rsi,
    });
  }

  // Calculate subsequent RSI values using Wilder's smoothing
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result.push({
        time: data[i + 1].time,
        value: 100,
      });
    } else {
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      result.push({
        time: data[i + 1].time,
        value: rsi,
      });
    }
  }

  return result;
}

/**
 * Calculate indicator based on config
 */
export function calculateIndicator(
  data: BinanceKline[],
  config: IndicatorConfigUnion
): IndicatorDataPoint[] {
  switch (config.type) {
    case 'MA':
      return calculateMA(data, (config as MAConfig).period, 'close');
    case 'EMA':
      return calculateEMA(data, (config as EMAConfig).period, 'close');
    case 'RSI':
      return calculateRSI(data, (config as RSIConfig).period || 14);
    default:
      return [];
  }
}

