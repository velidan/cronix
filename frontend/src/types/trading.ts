export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TradingLine {
  id: string;
  type: 'entry' | 'stop-loss' | 'take-profit-1' | 'take-profit-2';
  price: number;
  color: string;
  label: string;
  draggable: boolean;
}

export interface Symbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
}

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export interface ChartSettings {
  symbol: string;
  timeframe: TimeFrame;
  tradingLines: TradingLine[];
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
}