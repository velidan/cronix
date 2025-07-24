import { CandlestickData } from '../types/trading'

// Generate demo candlestick data
export const generateDemoChartData = (
  symbol: string,
  timeframe: string,
  count: number = 100
): CandlestickData[] => {
  const data: CandlestickData[] = []
  
  // Base prices for different symbols
  const basePrices: { [key: string]: number } = {
    'BTC-USDT': 45000,
    'ETH-USDT': 3000,
    'BNB-USDT': 300,
    'ADA-USDT': 0.5,
    'SOL-USDT': 100,
    'DOT-USDT': 7,
    'MATIC-USDT': 0.8,
    'LINK-USDT': 15,
  }

  // Timeframe intervals in minutes
  const timeframeMinutes: { [key: string]: number } = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '1h': 60,
    '4h': 240,
    '1d': 1440,
    '1w': 10080,
  }

  const basePrice = basePrices[symbol] || 1000
  const interval = timeframeMinutes[timeframe] || 60
  const now = Date.now()
  
  let currentPrice = basePrice
  
  for (let i = count - 1; i >= 0; i--) {
    const time = Math.floor((now - (i * interval * 60 * 1000)) / 1000)
    
    // Generate random price movement
    const volatility = basePrice * 0.02 // 2% volatility
    const priceChange = (Math.random() - 0.5) * volatility
    
    const open = currentPrice
    const close = Math.max(0.01, open + priceChange)
    const high = Math.max(open, close) + Math.random() * (volatility * 0.5)
    const low = Math.min(open, close) - Math.random() * (volatility * 0.5)
    const volume = Math.random() * 1000 + 100
    
    data.push({
      time,
      open: parseFloat(open.toFixed(8)),
      high: parseFloat(high.toFixed(8)),
      low: parseFloat(Math.max(0.01, low).toFixed(8)),
      close: parseFloat(close.toFixed(8)),
      volume: parseFloat(volume.toFixed(2))
    })
    
    currentPrice = close
  }
  
  return data.sort((a, b) => a.time - b.time)
}

// Generate realistic price updates for live data simulation
export const generatePriceUpdate = (
  lastCandle: CandlestickData,
  symbol: string
): CandlestickData => {
  const basePrices: { [key: string]: number } = {
    'BTC-USDT': 45000,
    'ETH-USDT': 3000,
    'BNB-USDT': 300,
    'ADA-USDT': 0.5,
    'SOL-USDT': 100,
    'DOT-USDT': 7,
    'MATIC-USDT': 0.8,
    'LINK-USDT': 15,
  }

  const basePrice = basePrices[symbol] || 1000
  const volatility = basePrice * 0.001 // 0.1% volatility for updates
  const priceChange = (Math.random() - 0.5) * volatility
  
  const newClose = Math.max(0.01, lastCandle.close + priceChange)
  const newHigh = Math.max(lastCandle.high, newClose)
  const newLow = Math.min(lastCandle.low, newClose)
  const newVolume = lastCandle.volume + Math.random() * 10
  
  return {
    time: lastCandle.time,
    open: lastCandle.open,
    high: parseFloat(newHigh.toFixed(8)),
    low: parseFloat(Math.max(0.01, newLow).toFixed(8)),
    close: parseFloat(newClose.toFixed(8)),
    volume: parseFloat((newVolume || 0).toFixed(2))
  }
}

// Format price based on symbol
export const formatPrice = (price: number, symbol: string): string => {
  const smallValueSymbols = ['ADA-USDT', 'MATIC-USDT']
  const decimals = smallValueSymbols.includes(symbol) ? 4 : 2
  return price.toFixed(decimals)
}

// Calculate price change percentage
export const calculatePriceChange = (current: number, previous: number): number => {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}