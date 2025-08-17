// Mock bracket orders service for development
// This file handles mock data when backend is not available

import { BracketOrderResponse } from '../types/bracketOrder'

// Store mock orders in memory (will be cleared on page refresh)
let mockOrders: BracketOrderResponse[] = []

export const clearMockOrders = () => {
  mockOrders = []
}

export const getMockOrders = (): BracketOrderResponse[] => {
  return mockOrders
}

export const addMockOrder = (order: BracketOrderResponse) => {
  mockOrders.push(order)
}

export const removeMockOrder = (orderId: string) => {
  mockOrders = mockOrders.filter(o => o.id !== orderId)
}

export const updateMockOrder = (orderId: string, updates: Partial<BracketOrderResponse>) => {
  mockOrders = mockOrders.map(order => 
    order.id === orderId 
      ? { ...order, ...updates }
      : order
  )
}