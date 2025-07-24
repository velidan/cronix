import { useEffect, useRef } from 'react'
import { Chart } from 'lightweight-charts-react-wrapper'
import { useTradingStore } from '../store/tradingStore'
import { Activity } from 'lucide-react'

const TradingChart = () => {
  const { 
    chartData, 
    isLoading, 
    tradingLines, 
    currentSymbol,
    currentTimeframe,
  } = useTradingStore()

  // Chart options
  const chartOptions = {
    layout: {
      background: { color: 'transparent' },
      textColor: '#DDD',
    },
    grid: {
      vertLines: { color: '#334155' },
      horzLines: { color: '#334155' },
    },
    crosshair: {
      mode: 1,
    },
    rightPriceScale: {
      borderColor: '#485563',
    },
    timeScale: {
      borderColor: '#485563',
      timeVisible: true,
      secondsVisible: false,
    },
    watermark: {
      visible: true,
      fontSize: 24,
      horzAlign: 'center',
      vertAlign: 'center',
      color: 'rgba(171, 71, 188, 0.3)',
      text: 'Cronix Trading Terminal',
    },
  }

  // Candlestick series options
  const candlestickOptions = {
    upColor: '#10b981',
    downColor: '#ef4444',
    borderVisible: false,
    wickUpColor: '#10b981',
    wickDownColor: '#ef4444',
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-card rounded-lg border border-border">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading chart data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-foreground">
            {currentSymbol} - {currentTimeframe}
          </h3>
          {chartData.length > 0 && (
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>O: {chartData[chartData.length - 1]?.open?.toFixed(2)}</span>
              <span>H: {chartData[chartData.length - 1]?.high?.toFixed(2)}</span>
              <span>L: {chartData[chartData.length - 1]?.low?.toFixed(2)}</span>
              <span className={`font-semibold ${
                chartData[chartData.length - 1]?.close >= chartData[chartData.length - 1]?.open 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                C: {chartData[chartData.length - 1]?.close?.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="h-96 w-full">
        {chartData.length > 0 ? (
          <Chart options={chartOptions} autoSize>
            <Chart.Series
              type="Candlestick"
              data={chartData}
              options={candlestickOptions}
            />
          </Chart>
        ) : (
          <div className="flex items-center justify-center h-full bg-muted/10 rounded border-2 border-dashed border-border">
            <p className="text-muted-foreground">No chart data available</p>
          </div>
        )}
      </div>

      {/* Trading Lines Legend */}
      {tradingLines.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tradingLines.map((line) => (
            <div 
              key={line.id}
              className="flex items-center space-x-2 px-3 py-1 bg-secondary rounded-lg text-sm"
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: line.color }}
              />
              <span className="text-secondary-foreground">
                {line.label}: ${line.price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TradingChart