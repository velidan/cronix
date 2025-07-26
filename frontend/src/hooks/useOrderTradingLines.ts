import { useEffect } from 'react'
import { useTradingStore } from '../store/tradingStore'
import { useBracketOrderStore } from '../store/bracketOrderStore'
import { TradingLine } from '../types/trading'

export const useOrderTradingLines = () => {
  const { setTradingLines, removeTradingLine } = useTradingStore()
  const { orders } = useBracketOrderStore()

  useEffect(() => {
    // Convert orders to trading lines
    const lines: TradingLine[] = []
    
    console.log('useOrderTradingLines - Converting orders to lines:', orders)
    
    orders.forEach(order => {
      console.log('Processing order:', order.id, 'stop_loss:', order.stop_loss_price, 'tp_levels:', order.take_profit_levels)
      // Entry line
      if (order.entry_price) {
        lines.push({
          id: `order-${order.id}-entry`,
          type: 'entry',
          price: Number(order.entry_price),
          label: 'Entry',
          color: '#3B82F6', // Blue
          draggable: true
        })
      }
      
      // Stop loss line
      if (order.stop_loss_price) {
        lines.push({
          id: `order-${order.id}-stop`,
          type: 'stop-loss',
          price: Number(order.stop_loss_price),
          label: 'Stop Loss',
          color: '#EF4444', // Red
          draggable: true
        })
      }
      
      // Take profit lines
      if (order.take_profit_levels) {
        order.take_profit_levels.forEach((tp, index) => {
          lines.push({
            id: `order-${order.id}-tp${index + 1}`,
            type: index === 0 ? 'take-profit-1' : 'take-profit-2',
            price: Number(tp.price),
            label: `TP${index + 1}`,
            color: index === 0 ? '#10B981' : '#06B6D4', // Green for TP1, Cyan for TP2
            draggable: true
          })
        })
      }
    })
    
    // Update all trading lines at once
    setTradingLines(lines)
  }, [orders, setTradingLines])
}