import { useState } from 'react'
import { useTradingStore } from '../store/tradingStore'
import { TimeFrame, TradingLine } from '../types/trading'
import { Plus, Trash2, TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react'

const TradingControls = () => {
  const {
    currentSymbol,
    currentTimeframe,
    tradingLines,
    setSymbol,
    setTimeframe,
    addTradingLine,
    removeTradingLine
  } = useTradingStore()

  const [newLinePrice, setNewLinePrice] = useState('')
  const [selectedLineType, setSelectedLineType] = useState<TradingLine['type']>('entry')

  // Available symbols (you can expand this or fetch from API)
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
    'entry': { color: '#3b82f6', label: 'Entry', icon: TrendingUp },
    'stop-loss': { color: '#ef4444', label: 'Stop Loss', icon: TrendingDown },
    'take-profit-1': { color: '#10b981', label: 'Take Profit 1', icon: Target },
    'take-profit-2': { color: '#06b6d4', label: 'Take Profit 2', icon: DollarSign },
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
    <div className="space-y-6">
      {/* Symbol and Timeframe Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Trading Pair
          </label>
          <select
            value={currentSymbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {symbols.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Timeframe
          </label>
          <div className="flex space-x-1">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentTimeframe === tf.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Trading Lines */}
      <div className="trading-card">
        <h4 className="text-lg font-semibold text-foreground mb-4">Trading Lines</h4>
        
        <div className="flex space-x-2 mb-4">
          <select
            value={selectedLineType}
            onChange={(e) => setSelectedLineType(e.target.value as TradingLine['type'])}
            className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          
          <button
            onClick={handleAddLine}
            disabled={!newLinePrice || isNaN(parseFloat(newLinePrice))}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>

        {/* Active Trading Lines */}
        {tradingLines.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground">Active Lines:</h5>
            {tradingLines.map((line) => {
              const config = lineTypes[line.type]
              const Icon = config.icon
              return (
                <div
                  key={line.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: line.color }}
                    />
                    <Icon className="h-4 w-4 text-secondary-foreground" />
                    <span className="text-secondary-foreground font-medium">
                      {line.label}
                    </span>
                    <span className="text-secondary-foreground">
                      ${line.price.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeTradingLine(line.id)}
                    className="text-destructive hover:text-destructive/80 p-1 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TradingControls