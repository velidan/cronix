import api from './api'
import { BracketOrderCreate, BracketOrderResponse } from '../types/bracketOrder'
import { getMockOrders, addMockOrder, removeMockOrder, updateMockOrder } from './mockBracketOrders'

// Flag to track if backend is available
let backendAvailable = true

export const bracketOrdersApi = {
  // Create a new bracket order
  create: async (order: BracketOrderCreate): Promise<BracketOrderResponse> => {
    try {
      const response = await api.post('/bracket-orders', order)
      backendAvailable = true
      return response.data
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
        // Backend not available, use mock
        backendAvailable = false
        const mockOrder: BracketOrderResponse = {
          ...order,
          id: `mock-${Date.now()}`,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        addMockOrder(mockOrder)
        return mockOrder
      }
      throw error
    }
  },

  // Get all bracket orders
  getAll: async (symbol?: string): Promise<BracketOrderResponse[]> => {
    try {
      const params = symbol ? { symbol } : {}
      const response = await api.get('/bracket-orders', { params })
      backendAvailable = true
      return response.data
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
        // Backend not available, return empty array or mock orders
        backendAvailable = false
        return getMockOrders().filter(o => !symbol || o.symbol === symbol)
      }
      throw error
    }
  },

  // Get a specific bracket order
  getById: async (orderId: string): Promise<BracketOrderResponse> => {
    const response = await api.get(`/bracket-orders/${orderId}`)
    return response.data
  },

  // Update a bracket order
  update: async (orderId: string, updates: any): Promise<BracketOrderResponse> => {
    try {
      const response = await api.put(`/bracket-orders/${orderId}`, updates)
      backendAvailable = true
      return response.data
    } catch (error: any) {
      if ((error?.response?.status === 404 || error?.code === 'ERR_NETWORK') && orderId.startsWith('mock-')) {
        // Handle mock order update
        backendAvailable = false
        const mockOrder = getMockOrders().find(o => o.id === orderId)
        if (mockOrder) {
          const updated = { ...mockOrder, ...updates, updated_at: new Date().toISOString() }
          updateMockOrder(orderId, updated)
          return updated
        }
      }
      throw error
    }
  },

  // Cancel a bracket order
  cancel: async (orderId: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/bracket-orders/${orderId}`)
      backendAvailable = true
      return response.data
    } catch (error: any) {
      if (error?.response?.status === 404 || (error?.code === 'ERR_NETWORK' && orderId.startsWith('mock-'))) {
        // If it's a mock order or backend not available, just remove from mock store
        backendAvailable = false
        removeMockOrder(orderId)
        return { message: 'Order cancelled successfully' }
      }
      throw error
    }
  },

  // Get current market price
  getMarketPrice: async (symbol: string): Promise<{ symbol: string; price: string }> => {
    const response = await api.get(`/bracket-orders/${symbol}/market-price`)
    return response.data
  }
}