import { create } from 'zustand'
import { ChartSettings, TradingLine, TimeFrame, CandlestickData } from '../types/trading'

interface TradingState {
  // Chart settings
  currentSymbol: string
  currentTimeframe: TimeFrame
  tradingLines: TradingLine[]
  
  // Chart data
  chartData: CandlestickData[]
  isLoading: boolean
  
  // Actions
  setSymbol: (symbol: string) => void
  setTimeframe: (timeframe: TimeFrame) => void
  addTradingLine: (line: TradingLine) => void
  updateTradingLine: (id: string, updates: Partial<TradingLine>) => void
  removeTradingLine: (id: string) => void
  setTradingLines: (lines: TradingLine[]) => void
  setChartData: (data: CandlestickData[]) => void
  updateLastCandle: (candle: CandlestickData) => void
  setLoading: (loading: boolean) => void
}

export const useTradingStore = create<TradingState>((set, get) => ({
  // Initial state
  currentSymbol: 'BTC-USDT',
  currentTimeframe: '1h',
  tradingLines: [],
  chartData: [],
  isLoading: false,

  // Actions
  setSymbol: (symbol: string) => {
    set({ currentSymbol: symbol, isLoading: true })
  },

  setTimeframe: (timeframe: TimeFrame) => {
    set({ currentTimeframe: timeframe, isLoading: true })
  },

  addTradingLine: (line: TradingLine) => {
    set((state) => ({
      tradingLines: [...state.tradingLines, line]
    }))
  },

  updateTradingLine: (id: string, updates: Partial<TradingLine>) => {
    set((state) => ({
      tradingLines: state.tradingLines.map(line =>
        line.id === id ? { ...line, ...updates } : line
      )
    }))
  },

  removeTradingLine: (id: string) => {
    set((state) => ({
      tradingLines: state.tradingLines.filter(line => line.id !== id)
    }))
  },

  setTradingLines: (lines: TradingLine[]) => {
    set({ tradingLines: lines })
  },

  setChartData: (data: CandlestickData[]) => {
    set({ chartData: data, isLoading: false })
  },

  updateLastCandle: (candle: CandlestickData) => {
    set((state) => {
      const newData = [...state.chartData]
      if (newData.length > 0 && newData[newData.length - 1].time === candle.time) {
        // Update existing candle
        newData[newData.length - 1] = candle
      } else {
        // Add new candle
        newData.push(candle)
      }
      return { chartData: newData }
    })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },
}))