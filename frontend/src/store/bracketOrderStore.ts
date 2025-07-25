import { create } from 'zustand'
import { BracketOrderResponse } from '../types/bracketOrder'

interface BracketOrderState {
  // Orders
  orders: BracketOrderResponse[]
  currentOrderLines: { [orderId: string]: { [lineType: string]: any } }
  
  // Actions
  addOrder: (order: BracketOrderResponse) => void
  updateOrder: (orderId: string, updates: Partial<BracketOrderResponse>) => void
  removeOrder: (orderId: string) => void
  setOrders: (orders: BracketOrderResponse[]) => void
  
  // Line tracking
  addOrderLine: (orderId: string, lineType: string, priceLine: any) => void
  removeOrderLine: (orderId: string, lineType: string) => void
  getOrderByLineId: (lineId: string) => { order: BracketOrderResponse | null; lineType: string | null }
}

export const useBracketOrderStore = create<BracketOrderState>((set, get) => ({
  // Initial state
  orders: [],
  currentOrderLines: {},

  // Actions
  addOrder: (order: BracketOrderResponse) => {
    set((state) => ({
      orders: [...state.orders, order]
    }))
  },

  updateOrder: (orderId: string, updates: Partial<BracketOrderResponse>) => {
    set((state) => ({
      orders: state.orders.map(order =>
        order.id === orderId ? { ...order, ...updates } : order
      )
    }))
  },

  removeOrder: (orderId: string) => {
    set((state) => ({
      orders: state.orders.filter(order => order.id !== orderId),
      currentOrderLines: Object.fromEntries(
        Object.entries(state.currentOrderLines).filter(([key]) => key !== orderId)
      )
    }))
  },

  setOrders: (orders: BracketOrderResponse[]) => {
    set({ orders })
  },

  // Line tracking
  addOrderLine: (orderId: string, lineType: string, priceLine: any) => {
    set((state) => ({
      currentOrderLines: {
        ...state.currentOrderLines,
        [orderId]: {
          ...state.currentOrderLines[orderId],
          [lineType]: priceLine
        }
      }
    }))
  },

  removeOrderLine: (orderId: string, lineType: string) => {
    set((state) => {
      const orderLines = { ...state.currentOrderLines[orderId] }
      delete orderLines[lineType]
      
      return {
        currentOrderLines: {
          ...state.currentOrderLines,
          [orderId]: orderLines
        }
      }
    })
  },

  getOrderByLineId: (lineId: string) => {
    const state = get()
    
    // Parse line ID format: "order-{orderId}-{lineType}"
    const match = lineId.match(/^order-(.+)-(.+)$/)
    if (!match) return { order: null, lineType: null }
    
    const [, orderId, lineType] = match
    const order = state.orders.find(o => o.id === orderId)
    
    return { order: order || null, lineType }
  },
}))