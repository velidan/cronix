import { useCallback, useEffect, useState } from 'react'
import { useTradingStore } from '../store/tradingStore'
import { Activity } from 'lucide-react'

const FinalTradingChart = () => {
  const [chartContainer, setChartContainer] = useState<HTMLDivElement | null>(null)
  const [chartInstance, setChartInstance] = useState<any>(null)
  const [seriesInstance, setSeriesInstance] = useState<any>(null)
  const [isChartReady, setIsChartReady] = useState(false)
  
  const { 
    chartData, 
    isLoading, 
    tradingLines, 
    currentSymbol,
    currentTimeframe,
  } = useTradingStore()

  // Callback ref to get the container element
  const chartContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      console.log('Chart container found via callback ref!')
      setChartContainer(node)
    }
  }, [])

  // Initialize chart when container is available
  useEffect(() => {
    if (!chartContainer) {
      console.log('No chart container available yet')
      return
    }

    let mounted = true
    
    const initChart = async () => {
      try {
        console.log('Initializing chart with container:', chartContainer)
        
        // Import the chart library
        const { createChart, ColorType, CrosshairMode } = await import('lightweight-charts')
        
        // Get container dimensions
        const rect = chartContainer.getBoundingClientRect()
        const width = Math.max(rect.width, 600) // Minimum 600px width
        
        console.log('Creating chart with dimensions:', { width, height: 400 })
        
        // Create the chart
        const chart = createChart(chartContainer, {
          layout: {
            background: { type: ColorType.Solid, color: '#1e293b' },
            textColor: '#e2e8f0',
          },
          grid: {
            vertLines: { color: '#334155' },
            horzLines: { color: '#334155' },
          },
          crosshair: {
            mode: CrosshairMode.Normal,
          },
          rightPriceScale: {
            borderColor: '#475569',
          },
          timeScale: {
            borderColor: '#475569',
            timeVisible: true,
            secondsVisible: false,
          },
          width: width,
          height: 400,
        })

        // Add candlestick series
        const series = chart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        })

        console.log('Chart created successfully!')
        
        if (mounted) {
          setChartInstance(chart)
          setSeriesInstance(series)
          setIsChartReady(true)
        }

      } catch (error) {
        console.error('Failed to create chart:', error)
      }
    }

    // Small delay to ensure container is fully rendered
    const timer = setTimeout(initChart, 100)
    
    return () => {
      mounted = false
      clearTimeout(timer)
      if (chartInstance) {
        console.log('Cleaning up chart')
        chartInstance.remove()
      }
    }
  }, [chartContainer])

  // Update chart data
  useEffect(() => {
    if (seriesInstance && chartData.length > 0) {
      console.log('Setting chart data:', chartData.length, 'candles')
      try {
        seriesInstance.setData(chartData)
      } catch (error) {
        console.error('Failed to set chart data:', error)
      }
    }
  }, [seriesInstance, chartData])

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

      {/* Chart Container */}
      <div className="bg-slate-800 rounded-lg border-2 border-slate-600 relative p-2">
        <div 
          ref={chartContainerRef}
          className="w-full bg-slate-900 rounded"
          style={{ height: '400px', minHeight: '400px' }}
        />
        
        {/* Status overlay */}
        {!isChartReady && (
          <div className="absolute inset-2 flex items-center justify-center bg-slate-800/95 rounded">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">
                {chartContainer ? 'Creating chart...' : 'Waiting for container...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-2 text-xs text-muted-foreground space-y-1">
        <div>Container: {chartContainer ? '✅ Found' : '❌ Not Found'}</div>
        <div>Chart Ready: {isChartReady ? '✅ Yes' : '❌ No'}</div>
        <div>Data Points: {chartData.length}</div>
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

export default FinalTradingChart