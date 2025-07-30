import { useState } from 'react'
import { useTradingStore } from '../store/tradingStore'
import { TimeFrame, TradingLine } from '../types/trading'
import { Plus } from 'lucide-react'

const TradingToolbar = () => {
  const {
    currentSymbol,
    currentTimeframe,
    setSymbol,
    setTimeframe,
    addTradingLine
  } = useTradingStore()

  const [newLinePrice, setNewLinePrice] = useState('')
  const [selectedLineType, setSelectedLineType] = useState<TradingLine['type']>('entry')

  // Available symbols
  const symbols = [
    'BTC-USDT', 'ETH-USDT', 'BNB-USDT', 'ADA-USDT', 
    'SOL-USDT', 'DOT-USDT', 'MATIC-USDT', 'LINK-USDT'
  ]

  // Available timeframes
  const timeframes: { value: TimeFrame; label: string }[] = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' },
    { value: '1w', label: '1w' },
  ]

  // Line type configurations
  const lineTypes = {
    'entry': { color: '#3b82f6', label: 'Entry' },
    'stop-loss': { color: '#ef4444', label: 'Stop Loss' },
    'take-profit-1': { color: '#10b981', label: 'TP1' },
    'take-profit-2': { color: '#06b6d4', label: 'TP2' },
  }

  const handleAddLine = () => {
    const price = parseFloat(newLinePrice)
    if (isNaN(price) || price <= 0) return

    const lineConfig = lineTypes[selectedLineType]
    const newLine: TradingLine = {
      id: `${selectedLineType}-${Date.now()}`,
      type: selectedLineType,
      price,
      color: lineConfig.color,
      label: lineConfig.label,
      draggable: true,
    }

    addTradingLine(newLine)
    setNewLinePrice('')
  }

  return (
    <div className="trading-toolbar flex items-center gap-3 px-3 py-2 bg-slate-900/80 border-b border-white/10">
      {/* Symbol Selection */}
      <select
        value={currentSymbol}
        onChange={(e) => setSymbol(e.target.value)}
        className="px-2 py-1 bg-slate-800 border border-white/10 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {symbols.map((symbol) => (
          <option key={symbol} value={symbol}>
            {symbol}
          </option>
        ))}
      </select>

      {/* Timeframe Tabs */}
      <div className="flex gap-1 border-l border-white/10 pl-3">
        {timeframes.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              currentTimeframe === tf.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Line Controls */}
      <div className="flex items-center gap-2 ml-auto">
        <select
          value={selectedLineType}
          onChange={(e) => setSelectedLineType(e.target.value as TradingLine['type'])}
          className="px-2 py-1 bg-slate-800 border border-white/10 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {Object.entries(lineTypes).map(([type, config]) => (
            <option key={type} value={type}>
              {config.label}
            </option>
          ))}
        </select>
        
        <input
          type="number"
          placeholder="Price"
          value={newLinePrice}
          onChange={(e) => setNewLinePrice(e.target.value)}
          className="w-20 px-2 py-1 bg-slate-800 border border-white/10 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        
        <button
          onClick={handleAddLine}
          disabled={!newLinePrice || isNaN(parseFloat(newLinePrice))}
          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
    </div>
  )
}

export default TradingToolbar