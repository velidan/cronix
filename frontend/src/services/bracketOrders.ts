import api from './api'
import { BracketOrderCreate, BracketOrderResponse } from '../types/bracketOrder'

export const bracketOrdersApi = {
  // Create a new bracket order
  create: async (order: BracketOrderCreate): Promise<BracketOrderResponse> => {
    const response = await api.post('/bracket-orders', order)
    return response.data
  },

  // Get all bracket orders
  getAll: async (symbol?: string): Promise<BracketOrderResponse[]> => {
    const params = symbol ? { symbol } : {}
    const response = await api.get('/bracket-orders', { params })
    return response.data
  },

  // Get a specific bracket order
  getById: async (orderId: string): Promise<BracketOrderResponse> => {
    const response = await api.get(`/bracket-orders/${orderId}`)
    return response.data
  },

  // Update a bracket order
  update: async (orderId: string, updates: any): Promise<BracketOrderResponse> => {
    const response = await api.put(`/bracket-orders/${orderId}`, updates)
    return response.data
  },

  // Cancel a bracket order
  cancel: async (orderId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/bracket-orders/${orderId}`)
    return response.data
  },

  // Get current market price
  getMarketPrice: async (symbol: string): Promise<{ symbol: string; price: string }> => {
    const response = await api.get(`/bracket-orders/${symbol}/market-price`)
    return response.data
  }
}