import { useEffect, useRef } from 'react'
import { useTradingStore } from '../store/tradingStore'
import { Activity } from 'lucide-react'

const SimpleTradingChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  
  const { 
    chartData, 
    isLoading, 
    tradingLines, 
    currentSymbol,
    currentTimeframe,
  } = useTradingStore()

  // Initialize chart
  useEffect(() => {
    const initChart = async () => {
      // Wait for the DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!chartContainerRef.current) {
        console.log('Chart container ref is null')
        return
      }

      try {
        // Dynamic import to avoid SSR issues
        const LightweightCharts = await import('lightweight-charts')
        
        const containerWidth = chartContainerRef.current.clientWidth || 800
        
        const chart = LightweightCharts.createChart(chartContainerRef.current, {
          layout: {
            background: { type: LightweightCharts.ColorType.Solid, color: '#1e293b' },
            textColor: '#e2e8f0',
          },
          grid: {
            vertLines: { color: '#334155' },
            horzLines: { color: '#334155' },
          },
          crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
          },
          rightPriceScale: {
            borderColor: '#475569',
          },
          timeScale: {
            borderColor: '#475569',
            timeVisible: true,
            secondsVisible: false,
          },
          width: containerWidth,
          height: 400,
        })

        const candleSeries = chart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        })

        chartRef.current = chart
        seriesRef.current = candleSeries

        console.log('Chart initialized successfully')

        // Handle resize
        const handleResize = () => {
          if (chartContainerRef.current && chartRef.current) {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth || 800,
            })
          }
        }

        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
          if (chartRef.current) {
            chartRef.current.remove()
            chartRef.current = null
            seriesRef.current = null
          }
        }
      } catch (error) {
        console.error('Failed to initialize chart:', error)
      }
    }

    initChart()
    
    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        seriesRef.current = null
      }
    }
  }, [])

  // Update chart data
  useEffect(() => {
    if (seriesRef.current && chartData.length > 0) {
      try {
        seriesRef.current.setData(chartData)
      } catch (error) {
        console.error('Failed to set chart data:', error)
      }
    }
  }, [chartData])

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
      <div className="bg-slate-800 rounded-lg border border-border">
        <div ref={chartContainerRef} className="w-full h-96 min-w-0" style={{ minHeight: '400px' }} />
        
        {/* Fallback if chart fails to load */}
        {!chartRef.current && chartData.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/90 rounded-lg">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Initializing chart...</p>
            </div>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-2 text-xs text-muted-foreground">
        Chart Data Points: {chartData.length} | Chart Initialized: {chartRef.current ? 'Yes' : 'No'}
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

export default SimpleTradingChart