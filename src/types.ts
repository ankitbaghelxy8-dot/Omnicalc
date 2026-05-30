/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  type: 'calculator' | 'currency';
  details?: string; // Additional details (e.g. rate used: 1 USD = 0.92 EUR)
}

export interface CurrencyData {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export type CalculatorMode = 'degree' | 'radian';

export interface VaultMediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string; // can be base64 or placeholder/stock URLs
  name: string;
  size?: string;
  timestamp: number;
}

