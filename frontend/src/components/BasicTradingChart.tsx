import { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts'
import { useTradingStore } from '../store/tradingStore'
import { Activity } from 'lucide-react'

const BasicTradingChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  
  const { 
    chartData, 
    isLoading, 
    tradingLines, 
    currentSymbol,
    currentTimeframe,
  } = useTradingStore()

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
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
      width: chartContainerRef.current.clientWidth,
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

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  // Update chart data
  useEffect(() => {
    if (seriesRef.current && chartData.length > 0) {
      seriesRef.current.setData(chartData)
    }
  }, [chartData])

  // Add trading lines
  useEffect(() => {
    if (!chartRef.current) return

    // Clear existing price lines
    // Note: In a real implementation, you'd need to track and remove specific lines
    
    // Add new price lines
    tradingLines.forEach(line => {
      if (chartRef.current) {
        seriesRef.current?.createPriceLine({
          price: line.price,
          color: line.color,
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: line.label,
        })
      }
    })
  }, [tradingLines])

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

      <div ref={chartContainerRef} className="w-full h-96" />

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

export default BasicTradingChart