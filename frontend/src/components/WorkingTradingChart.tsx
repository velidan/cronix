import { useEffect, useRef, useState } from 'react'
import { useTradingStore } from '../store/tradingStore'
import { Activity } from 'lucide-react'

const WorkingTradingChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
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

  // Initialize chart after component mounts
  useEffect(() => {
    let mounted = true
    
    const initChart = async () => {
      // Wait multiple render cycles to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (!mounted || !chartContainerRef.current) {
        console.log('Chart init cancelled - not mounted or no container')
        return
      }

      try {
        console.log('Starting chart initialization...')
        
        // Dynamic import
        const { createChart, ColorType, CrosshairMode } = await import('lightweight-charts')
        
        // Get container dimensions
        const container = chartContainerRef.current
        const rect = container.getBoundingClientRect()
        const width = rect.width > 0 ? rect.width : 800
        
        console.log('Container dimensions:', { width, height: 400 })
        
        // Create chart
        const chart = createChart(container, {
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
        console.error('Chart initialization failed:', error)
      }
    }

    initChart()
    
    return () => {
      mounted = false
      if (chartInstance) {
        chartInstance.remove()
      }
    }
  }, []) // Empty dependency array - only run once

  // Update chart data when available
  useEffect(() => {
    if (seriesInstance && chartData.length > 0) {
      console.log('Setting chart data:', chartData.length, 'points')
      try {
        seriesInstance.setData(chartData)
      } catch (error) {
        console.error('Failed to set chart data:', error)
      }
    }
  }, [seriesInstance, chartData])

  // Handle window resize
  useEffect(() => {
    if (!chartInstance) return

    const handleResize = () => {
      if (chartContainerRef.current && chartInstance) {
        const rect = chartContainerRef.current.getBoundingClientRect()
        chartInstance.applyOptions({
          width: rect.width > 0 ? rect.width : 800,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [chartInstance])

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

      {/* Chart Container with explicit dimensions */}
      <div 
        className="bg-slate-800 rounded-lg border border-border relative"
        style={{ width: '100%', height: '400px', minHeight: '400px' }}
      >
        <div 
          ref={chartContainerRef} 
          className="w-full h-full"
          style={{ width: '100%', height: '400px' }}
        />
        
        {/* Loading overlay */}
        {!isChartReady && (
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
        Chart Data: {chartData.length} points | Chart Ready: {isChartReady ? 'Yes' : 'No'} | Container: {chartContainerRef.current ? 'Found' : 'Not Found'}
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

export default WorkingTradingChart