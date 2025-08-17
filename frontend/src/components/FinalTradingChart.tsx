import { useCallback, useEffect, useState, useRef } from 'react'
import { useTradingStore } from '../store/tradingStore'
import { useBracketOrderStore } from '../store/bracketOrderStore'
import { bracketOrdersApi } from '../services/bracketOrders'
import PriceEditModal from './PriceEditModal'
import { Activity, Edit3, Check, X, XCircle } from 'lucide-react'
import DraggablePriceLinesPlugin from './DraggablePriceLinesPlugin'
import { useToast } from '../contexts/ToastContext'
import { validatePriceUpdate, validateBracketOrderPrices } from '../utils/priceValidation'

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
  
  // State for tracking pending drag changes
  const [pendingChanges, setPendingChanges] = useState<Map<string, {
    lineId: string
    lineType: string
    orderId: string
    oldPrice: number
    newPrice: number
  }>>(new Map())
  const [tempPrices, setTempPrices] = useState<Map<string, number>>(new Map())
  
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
  
  const toast = useToast()
  

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

  // Handle cancel button click for individual trading lines
  const handleCancelLine = useCallback(async (lineId: string) => {
    const { order, lineType } = getOrderByLineId(lineId)
    
    if (!order || !lineType) {
      console.error('Could not find order for line:', lineId)
      return
    }

    try {
      // Build update payload to remove the specific line
      const updates: any = {}
      
      switch (lineType) {
        case 'stop':
          updates.stop_loss_price = null
          break
        case 'tp1':
        case 'tp2':
          // For take profits, we need to remove from the array
          if (!order.take_profit_levels || order.take_profit_levels.length === 0) return
          
          const levelIndex = lineType === 'tp1' ? 0 : 1
          
          // Make sure the index exists
          if (levelIndex >= order.take_profit_levels.length) {
            alert(`Take profit level ${levelIndex + 1} does not exist`)
            return
          }
          
          // Create new array without the specified level
          if (lineType === 'tp1' && order.take_profit_levels.length > 1) {
            // If removing TP1 and TP2 exists, move TP2 to TP1 position
            updates.take_profit_levels = [order.take_profit_levels[1]]
          } else if (lineType === 'tp2') {
            // If removing TP2, keep TP1 if it exists
            updates.take_profit_levels = levelIndex === 1 && order.take_profit_levels.length > 1 
              ? [order.take_profit_levels[0]] 
              : []
          } else {
            // Default case
            updates.take_profit_levels = order.take_profit_levels.filter((_, index) => index !== levelIndex)
          }
          break
        case 'entry':
          // Can't cancel entry line - it's required
          toast.warning("Cannot Cancel Entry", "Entry line cannot be cancelled. Delete the entire order instead.")
          return
      }

      console.log('Cancelling line:', lineType, 'for order:', order.id, 'updates:', updates)
      console.log('Order before API call:', order)

      // Call API to update order
      const updatedOrder = await bracketOrdersApi.update(order.id, updates)
      
      // Update local state with the full order response from server
      console.log('Updated order from server:', updatedOrder)
      console.log('Stop loss in response:', updatedOrder.stop_loss_price)
      updateOrder(order.id, updatedOrder)
      
      // Show success toast
      const lineTypeDisplay = lineType === 'stop' ? 'Stop Loss' : 
                             lineType === 'tp1' ? 'Take Profit 1' :
                             lineType === 'tp2' ? 'Take Profit 2' : lineType.toUpperCase()
      toast.success('Line Cancelled', `${lineTypeDisplay} has been removed`)
      
    } catch (error: any) {
      console.error('Failed to cancel line:', error)
      const errorMessage = error?.response?.data?.detail || 'Failed to cancel line. Please try again.'
      toast.error('Cancellation Failed', errorMessage)
    }
  }, [getOrderByLineId, updateOrder, toast])

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
    let resizeHandler: (() => void) | null = null
    
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
        const chartHeight = Math.max(600, window.innerHeight - 300) // Minimum 600px, dynamic height
        
        console.log('Creating chart with dimensions:', { width, height: chartHeight })
        
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
          height: chartHeight,
        })
        
        // Handle window resize
        resizeHandler = () => {
          const newHeight = Math.max(600, window.innerHeight - 300)
          chart.applyOptions({ 
            width: chartContainer.offsetWidth,
            height: newHeight 
          })
        }
        window.addEventListener('resize', resizeHandler)

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
      // Remove the resize event listener if it exists
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
      }
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
      const { orderId, lineType, lineId } = editingLine
      const { order } = getOrderByLineId(lineId)
      if (!order) return

      // Validate the price update
      const tpPrices = order.take_profit_levels?.map(tp => tp.price) || []
      const validation = validatePriceUpdate(
        order.side,
        lineType as 'entry' | 'stop' | 'tp1' | 'tp2',
        newPrice,
        order.entry_price || 0,
        order.stop_loss_price,
        tpPrices
      )

      if (!validation.isValid) {
        toast.error('Invalid Price', validation.error)
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
          const tpIndex = lineType === 'tp1' ? 0 : 1
          const currentLevels = [...(order.take_profit_levels || [])]
          
          // Ensure the array has enough elements
          while (currentLevels.length <= tpIndex) {
            currentLevels.push({ price: 0, quantity: 0 })
          }
          
          // Update the specific level's price
          currentLevels[tpIndex] = {
            ...currentLevels[tpIndex],
            price: newPrice
          }
          
          updates.take_profit_levels = currentLevels
          break
      }

      // Call API to update order
      await bracketOrdersApi.update(orderId, updates)
      
      // Update local state
      updateOrder(orderId, updates)
      
      // Show success toast
      toast.success('Price Updated', `${lineType.toUpperCase()} price updated to $${newPrice.toFixed(2)}`)
      
      // Close modal
      setEditingLine(null)
      setShowPriceModal(false)
      
    } catch (error: any) {
      console.error('Failed to update price:', error)
      
      // Parse error message from API
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to update price'
      toast.error('Update Failed', errorMessage)
      
      throw error
    }
  }, [editingLine, updateOrder, getOrderByLineId, toast])

  // Handle price drag end event
  const handlePriceDragEnd = useCallback((lineId: string, oldPrice: number, newPrice: number) => {
    const { order, lineType } = getOrderByLineId(lineId)
    
    if (!order || !lineType) {
      console.error('Could not find order for line:', lineId)
      return
    }

    // Skip if price didn't change
    if (Math.abs(oldPrice - newPrice) < 0.01) {
      console.log('Price unchanged, skipping update')
      return
    }

    // Get the actual saved price from the order (not the last drag position)
    let savedPrice = oldPrice
    switch (lineType) {
      case 'entry':
        savedPrice = Number(order.entry_price) || oldPrice
        break
      case 'stop':
        savedPrice = Number(order.stop_loss_price) || oldPrice
        break
      case 'tp1':
        savedPrice = Number(order.take_profit_levels?.[0]?.price) || oldPrice
        break
      case 'tp2':
        savedPrice = Number(order.take_profit_levels?.[1]?.price) || oldPrice
        break
    }

    // Store the pending change with the actual saved price
    setPendingChanges(prev => {
      const newMap = new Map(prev)
      // Check if we already have a pending change for this line
      const existingChange = prev.get(lineId)
      newMap.set(lineId, {
        lineId,
        lineType,
        orderId: order.id,
        oldPrice: existingChange?.oldPrice ?? savedPrice, // Keep original saved price
        newPrice
      })
      return newMap
    })
    
    // Update temp prices for display
    setTempPrices(prev => {
      const newMap = new Map(prev)
      newMap.set(lineId, newPrice)
      return newMap
    })
  }, [getOrderByLineId])

  // Apply all pending changes
  const applyPendingChanges = useCallback(async () => {
    const changes = Array.from(pendingChanges.values())
    if (changes.length === 0) return

    let successfulUpdates = 0
    let failedUpdates = 0

    try {
      // Group changes by order ID to make batch updates
      const changesByOrder = new Map<string, typeof changes>()
      changes.forEach(change => {
        const orderChanges = changesByOrder.get(change.orderId) || []
        orderChanges.push(change)
        changesByOrder.set(change.orderId, orderChanges)
      })

      // Process each order's changes
      for (const [orderId, orderChanges] of changesByOrder) {
        const { order } = getOrderByLineId(orderChanges[0].lineId)
        if (!order) continue

        // Build update payload
        const updates: any = {}
        let takeProfitLevels = order.take_profit_levels ? [...order.take_profit_levels] : []
        
        // Collect all new prices for validation
        let newEntryPrice = order.entry_price || 0
        let newStopLoss = order.stop_loss_price
        let newTpPrices = takeProfitLevels.map(tp => tp.price)

        orderChanges.forEach(change => {
          switch (change.lineType) {
            case 'entry':
              updates.entry_price = change.newPrice
              newEntryPrice = change.newPrice
              break
            case 'stop':
              updates.stop_loss_price = change.newPrice
              newStopLoss = change.newPrice
              break
            case 'tp1':
              if (takeProfitLevels.length > 0) {
                takeProfitLevels[0] = { ...takeProfitLevels[0], price: change.newPrice }
                newTpPrices[0] = change.newPrice
              }
              break
            case 'tp2':
              if (takeProfitLevels.length > 1) {
                takeProfitLevels[1] = { ...takeProfitLevels[1], price: change.newPrice }
                newTpPrices[1] = change.newPrice
              }
              break
          }
        })

        // Validate all prices before making the API call
        const validation = validateBracketOrderPrices(
          order.side,
          newEntryPrice,
          newStopLoss,
          newTpPrices.filter(price => price > 0)
        )

        if (!validation.isValid) {
          // Show error toast
          toast.error('Invalid Price Configuration', validation.error)
          
          // Revert all dragged lines for this order
          orderChanges.forEach(change => {
            if (draggablePlugin) {
              draggablePlugin.updateLine(change.lineId, { price: Number(change.oldPrice) })
            }
            // Remove from pending changes
            pendingChanges.delete(change.lineId)
          })
          
          failedUpdates++
          // Skip this order and continue with others
          continue
        }

        // Add take profit levels if they were modified
        if (orderChanges.some(c => c.lineType === 'tp1' || c.lineType === 'tp2')) {
          updates.take_profit_levels = takeProfitLevels
        }

        console.log('Applying changes for order:', orderId, updates)

        // Call API to update order
        const updatedOrder = await bracketOrdersApi.update(orderId, updates)
        
        // Update local state with the response from server
        updateOrder(orderId, updatedOrder)
        
        // Remove successfully updated changes from pending
        orderChanges.forEach(change => {
          pendingChanges.delete(change.lineId)
        })
        
        successfulUpdates++
      }
      
      // Clear remaining pending changes (should be empty if all succeeded)
      setPendingChanges(new Map())
      setTempPrices(new Map())
      
      // Show appropriate toast based on results
      if (successfulUpdates > 0 && failedUpdates === 0) {
        toast.success('Prices Updated', 'All order prices have been successfully updated')
      } else if (successfulUpdates > 0 && failedUpdates > 0) {
        toast.warning('Partial Update', `${successfulUpdates} order(s) updated, ${failedUpdates} failed validation`)
      }
      // If all failed, the error toasts have already been shown
      
    } catch (error: any) {
      console.error('Failed to apply changes:', error)
      
      // Parse error message
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to update order prices'
      toast.error('Update Failed', errorMessage)
      
      // Revert all lines back to original prices
      pendingChanges.forEach(change => {
        if (draggablePlugin) {
          draggablePlugin.updateLine(change.lineId, { price: Number(change.oldPrice) })
        }
      })
      // Clear pending changes
      setPendingChanges(new Map())
      setTempPrices(new Map())
    }
  }, [pendingChanges, getOrderByLineId, updateOrder, draggablePlugin, toast])

  // Cancel all pending changes
  const cancelPendingChanges = useCallback(() => {
    // Revert all lines back to original prices
    pendingChanges.forEach(change => {
      if (draggablePlugin) {
        draggablePlugin.updateLine(change.lineId, { price: change.oldPrice })
      }
    })
    // Clear pending changes
    setPendingChanges(new Map())
    setTempPrices(new Map())
  }, [pendingChanges, draggablePlugin])

  // Cancel a single pending change
  const cancelSingleChange = useCallback((lineId: string) => {
    const change = pendingChanges.get(lineId)
    if (change && draggablePlugin) {
      // Revert the line back to original price
      draggablePlugin.updateLine(change.lineId, { price: Number(change.oldPrice) })
    }
    
    // Remove from pending changes
    setPendingChanges(prev => {
      const newMap = new Map(prev)
      newMap.delete(lineId)
      return newMap
    })
    
    // Remove from temp prices
    setTempPrices(prev => {
      const newMap = new Map(prev)
      newMap.delete(lineId)
      return newMap
    })
  }, [pendingChanges, draggablePlugin])

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
      <div className="flex items-center justify-center h-80 bg-slate-900/80 rounded-lg border border-white/10">
        <div className="text-center">
          <Activity className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-xs text-gray-400">Loading chart data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/80 rounded-lg border border-white/10 p-3 flex flex-col flex-1">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">
            {currentSymbol}
          </h3>
          {chartData.length > 0 && (
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-gray-500">O <span className="text-gray-300">{chartData[chartData.length - 1]?.open?.toFixed(2)}</span></span>
              <span className="text-gray-500">H <span className="text-gray-300">{chartData[chartData.length - 1]?.high?.toFixed(2)}</span></span>
              <span className="text-gray-500">L <span className="text-gray-300">{chartData[chartData.length - 1]?.low?.toFixed(2)}</span></span>
              <span className="text-gray-500">C <span className={`font-medium ${
                chartData[chartData.length - 1]?.close >= chartData[chartData.length - 1]?.open 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>{chartData[chartData.length - 1]?.close?.toFixed(2)}</span></span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div className="bg-slate-800 rounded border border-white/10 relative p-1 flex-1 flex flex-col">
        <div 
          ref={chartContainerRef}
          className="w-full flex-1 min-h-[600px] bg-slate-900 rounded"
        />
        
        {/* Status overlay */}
        {!isChartReady && (
          <div className="absolute inset-1 flex items-center justify-center bg-slate-800/95 rounded">
            <div className="text-center">
              <Activity className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-xs text-gray-400">
                {chartContainer ? 'Creating chart...' : 'Waiting for container...'}
              </p>
            </div>
          </div>
        )}
      </div>


      {/* Trading Lines Legend */}
      {tradingLines.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {tradingLines.map((line) => {
                const tempPrice = tempPrices.get(line.id)
                const hasPendingChange = pendingChanges.has(line.id)
                const displayPrice = tempPrice || line.price
                
                return (
                  <div 
                    key={line.id}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all ${
                      hasPendingChange ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-slate-800/50'
                    }`}
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: line.color }}
                    />
                    <span className={`${
                      hasPendingChange ? 'text-orange-400 font-medium' : 'text-gray-300'
                    }`}>
                      {line.label}: ${displayPrice.toFixed(2)}
                      {hasPendingChange && (
                        <span className="text-[10px] text-gray-500 ml-1">
                          (was ${line.price.toFixed(2)})
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {/* Add edit button for order lines */}
                      {line.id.startsWith('order-') && !hasPendingChange && (
                        <>
                          <button
                            onClick={() => handleEditLine(line.id)}
                            className="p-0.5 hover:bg-white/10 rounded transition-colors"
                            title="Edit price"
                          >
                            <Edit3 className="h-2.5 w-2.5 text-gray-500 hover:text-white" />
                          </button>
                          {/* Cancel button for individual lines (not for entry) */}
                          {!line.id.includes('-entry') && (
                            <button
                              onClick={() => handleCancelLine(line.id)}
                              className="p-0.5 hover:bg-red-500/20 rounded transition-colors group"
                              title="Cancel this line"
                            >
                              <XCircle className="h-2.5 w-2.5 text-gray-500 group-hover:text-red-400" />
                            </button>
                          )}
                        </>
                      )}
                      {/* Add cancel button for pending changes */}
                      {hasPendingChange && (
                        <button
                          onClick={() => cancelSingleChange(line.id)}
                          className="p-0.5 hover:bg-red-500/20 rounded transition-colors group"
                          title="Cancel this change"
                        >
                          <X className="h-2.5 w-2.5 text-orange-400 group-hover:text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Apply/Cancel Panel */}
            {pendingChanges.size > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 border border-orange-500/30 rounded">
                <span className="text-xs text-orange-400 mr-1">
                  {pendingChanges.size} change{pendingChanges.size > 1 ? 's' : ''}
                </span>
                <button
                  onClick={cancelPendingChanges}
                  className="flex items-center gap-0.5 px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded text-xs font-medium transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                  Cancel
                </button>
                <button
                  onClick={applyPendingChanges}
                  className="flex items-center gap-0.5 px-2 py-0.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-medium transition-colors"
                >
                  <Check className="h-2.5 w-2.5" />
                  Apply
                </button>
              </div>
            )}
          </div>
          
          <p className="text-[10px] text-gray-500 text-center">
            🖱️ Drag lines to modify | ✏️ Edit | ⊗ Cancel line
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