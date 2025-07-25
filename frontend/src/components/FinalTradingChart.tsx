import { useCallback, useEffect, useState, useRef } from 'react'
import { useTradingStore } from '../store/tradingStore'
import { useBracketOrderStore } from '../store/bracketOrderStore'
import { bracketOrdersApi } from '../services/bracketOrders'
import PriceEditModal from './PriceEditModal'
import { Activity, Edit3 } from 'lucide-react'
import DraggablePriceLinesPlugin from './DraggablePriceLinesPlugin'

const FinalTradingChart = () => {
  const [chartContainer, setChartContainer] = useState<HTMLDivElement | null>(null)
  const [chartInstance, setChartInstance] = useState<any>(null)
  const [seriesInstance, setSeriesInstance] = useState<any>(null)
  const [isChartReady, setIsChartReady] = useState(false)
  const [priceLines, setPriceLines] = useState<any[]>([])
  const [draggablePlugin, setDraggablePlugin] = useState<DraggablePriceLinesPlugin | null>(null)
  
  // Modal state for price editing
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [editingLine, setEditingLine] = useState<{
    lineId: string
    lineType: string
    currentPrice: number
    orderId: string
  } | null>(null)
  
  const { 
    chartData, 
    isLoading, 
    tradingLines, 
    currentSymbol,
    currentTimeframe,
  } = useTradingStore()

  const { 
    getOrderByLineId, 
    updateOrder, 
    addOrderLine,
    removeOrderLine 
  } = useBracketOrderStore()
  

  // Handle edit button click for trading lines
  const handleEditLine = useCallback((lineId: string) => {
    const { order, lineType } = getOrderByLineId(lineId)
    
    if (!order || !lineType) {
      console.error('Could not find order for line:', lineId)
      return
    }

    // Get the current price based on line type
    let currentPrice: number
    switch (lineType) {
      case 'entry':
        currentPrice = order.entry_price || 0
        break
      case 'stop':
        currentPrice = order.stop_loss_price || 0
        break
      case 'tp1':
        currentPrice = order.take_profit_levels[0]?.price || 0
        break
      case 'tp2':
        currentPrice = order.take_profit_levels[1]?.price || 0
        break
      default:
        console.error('Unknown line type:', lineType)
        return
    }

    // Show edit modal
    setEditingLine({
      lineId,
      lineType,
      currentPrice,
      orderId: order.id
    })
    setShowPriceModal(true)
  }, [getOrderByLineId])

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
        
        // Clear any existing chart first
        if (chartInstance) {
          console.log('Removing existing chart before creating new one')
          chartInstance.remove()
          setChartInstance(null)
          setSeriesInstance(null)
          setIsChartReady(false)
        }
        
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

        // Initialize draggable price lines plugin
        const plugin = new DraggablePriceLinesPlugin(chart as any, series, { lines: [] })
        
        console.log('Chart created successfully!')
        
        if (mounted) {
          setChartInstance(chart)
          setSeriesInstance(series)
          setDraggablePlugin(plugin)
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
      if (draggablePlugin) {
        try {
          draggablePlugin.destroy()
        } catch (error) {
          console.error('Error cleaning up draggable plugin:', error)
        }
      }
      if (chartInstance) {
        try {
          console.log('Cleaning up chart')
          chartInstance.remove()
        } catch (error) {
          console.error('Error cleaning up chart:', error)
        }
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

  // Confirm price update
  const confirmPriceUpdate = useCallback(async (newPrice: number) => {
    if (!editingLine) return

    try {
      const { orderId, lineType } = editingLine

      // Build update payload based on line type
      const updates: any = {}
      switch (lineType) {
        case 'entry':
          updates.entry_price = newPrice
          break
        case 'stop':
          updates.stop_loss_price = newPrice
          break
        case 'tp1':
        case 'tp2':
          // For take profits, we need to update the take_profit_levels array
          // This requires getting the full order and updating the specific level
          console.log('Take profit updates not yet implemented')
          return
      }

      // Call API to update order
      await bracketOrdersApi.update(orderId, updates)
      
      // Update local state
      updateOrder(orderId, updates)
      
      console.log('Price updated successfully:', lineType, newPrice)
      
      // Close modal
      setEditingLine(null)
      setShowPriceModal(false)
      
    } catch (error) {
      console.error('Failed to update price:', error)
      throw error
    }
  }, [editingLine, updateOrder])

  // Handle price drag end event
  const handlePriceDragEnd = useCallback(async (lineId: string, oldPrice: number, newPrice: number) => {
    try {
      const { order, lineType } = getOrderByLineId(lineId)
      
      if (!order || !lineType) {
        console.error('Could not find order for line:', lineId)
        return
      }

      // Build update payload based on line type
      const updates: any = {}
      switch (lineType) {
        case 'entry':
          updates.entry_price = newPrice
          break
        case 'stop':
          updates.stop_loss_price = newPrice
          break
        case 'tp1':
        case 'tp2':
          // For take profits, we need to update the take_profit_levels array
          const currentOrder = getOrderByLineId(lineId).order
          if (!currentOrder || !currentOrder.take_profit_levels) return
          
          const levelIndex = lineType === 'tp1' ? 0 : 1
          if (levelIndex >= currentOrder.take_profit_levels.length) return
          
          // Create updated take profit levels array
          const updatedLevels = [...currentOrder.take_profit_levels]
          updatedLevels[levelIndex] = {
            ...updatedLevels[levelIndex],
            price: newPrice
          }
          
          updates.take_profit_levels = updatedLevels
          break
      }

      // Call API to update order
      await bracketOrdersApi.update(order.id, updates)
      
      // Update local state
      updateOrder(order.id, updates)
      
      console.log('Price updated via drag:', lineType, 'from', oldPrice, 'to', newPrice)
      
    } catch (error) {
      console.error('Failed to update price via drag:', error)
      // Revert the line back to original price on error
      if (draggablePlugin) {
        draggablePlugin.updateLine(lineId, { price: oldPrice })
      }
    }
  }, [getOrderByLineId, updateOrder, draggablePlugin])

  // Add trading lines to chart using draggable plugin
  useEffect(() => {
    if (!draggablePlugin) return

    console.log('Updating draggable trading lines:', tradingLines.length)
    
    try {
      // Clear existing lines from plugin
      const existingLines = draggablePlugin.getLines()
      existingLines.forEach(line => {
        draggablePlugin.removeLine(line.id)
      })
      
      // Add new trading lines
      tradingLines.forEach(line => {
        if (line.id.startsWith('order-')) {
          console.log('Adding draggable line:', line.label, line.price)
          
          draggablePlugin.addLine({
            id: line.id,
            price: line.price,
            color: line.color,
            title: line.label,
            lineWidth: 2,
            lineStyle: 2, // Dashed line
            onDragStart: (price) => {
              console.log('Drag started for', line.label, 'at price', price)
            },
            onDrag: (price) => {
              // Update real-time during drag
              console.log('Dragging', line.label, 'to price', price)
            },
            onDragEnd: (oldPrice, newPrice) => {
              console.log('Drag ended for', line.label, 'from', oldPrice, 'to', newPrice)
              handlePriceDragEnd(line.id, oldPrice, newPrice)
            }
          })
          
          // Track the price line for bracket orders
          const match = line.id.match(/^order-(.+)-(.+)$/)
          if (match) {
            const [, orderId, lineType] = match
            // Note: We'll need to adapt addOrderLine to work with the plugin
            // addOrderLine(orderId, lineType, priceLine)
          }
        }
      })
      
      console.log('Updated draggable trading lines')
    } catch (error) {
      console.error('Failed to update draggable trading lines:', error)
    }
  }, [draggablePlugin, tradingLines, handlePriceDragEnd])

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
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-2">
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
                {/* Add edit button for order lines */}
                {line.id.startsWith('order-') && (
                  <button
                    onClick={() => handleEditLine(line.id)}
                    className="ml-2 p-1 hover:bg-secondary-foreground/10 rounded transition-colors"
                    title="Edit price"
                  >
                    <Edit3 className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            🖱️ Drag any trading line on the chart to modify its price, or click the edit button
          </p>
        </div>
      )}

      {/* Price Edit Modal */}
      {editingLine && (
        <PriceEditModal
          isOpen={showPriceModal}
          onClose={() => {
            setShowPriceModal(false)
            setEditingLine(null)
          }}
          onConfirm={confirmPriceUpdate}
          lineType={editingLine.lineType}
          currentPrice={editingLine.currentPrice}
          symbol={currentSymbol}
        />
      )}
    </div>
  )
}

export default FinalTradingChart