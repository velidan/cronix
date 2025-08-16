import { OrderSide } from '../types/bracketOrder'

export interface PriceValidationResult {
  isValid: boolean
  error?: string
}

export function validateBracketOrderPrices(
  side: OrderSide,
  entryPrice: number,
  stopLossPrice?: number,
  takeProfitPrices?: number[]
): PriceValidationResult {
  // For BUY orders:
  // Entry Price > Stop Loss
  // Take Profit > Entry Price
  
  // For SELL orders:
  // Entry Price < Stop Loss  
  // Take Profit < Entry Price

  // Ensure entryPrice is a valid number
  const entry = Number(entryPrice)
  if (isNaN(entry) || entry <= 0) {
    return {
      isValid: false,
      error: 'Invalid entry price'
    }
  }

  if (side === OrderSide.BUY) {
    // Validate stop loss
    if (stopLossPrice !== undefined && stopLossPrice >= entry) {
      const stopLoss = Number(stopLossPrice)
      return {
        isValid: false,
        error: `Stop loss ($${stopLoss.toFixed(2)}) must be below entry price ($${entry.toFixed(2)}) for BUY orders`
      }
    }

    // Validate take profits
    if (takeProfitPrices) {
      for (let i = 0; i < takeProfitPrices.length; i++) {
        const tp = Number(takeProfitPrices[i])
        if (tp > 0 && tp <= entry) {
          return {
            isValid: false,
            error: `Take profit ${i + 1} ($${tp.toFixed(2)}) must be above entry price ($${entry.toFixed(2)}) for BUY orders`
          }
        }
        
        // Check if TP2 is higher than TP1
        if (i === 1 && takeProfitPrices[0] > 0 && tp > 0 && tp <= takeProfitPrices[0]) {
          const tp1 = Number(takeProfitPrices[0])
          return {
            isValid: false,
            error: `Take profit 2 ($${tp.toFixed(2)}) must be higher than take profit 1 ($${tp1.toFixed(2)})`
          }
        }
      }
    }
  } else { // SELL order
    // Validate stop loss
    if (stopLossPrice !== undefined && stopLossPrice <= entry) {
      const stopLoss = Number(stopLossPrice)
      return {
        isValid: false,
        error: `Stop loss ($${stopLoss.toFixed(2)}) must be above entry price ($${entry.toFixed(2)}) for SELL orders`
      }
    }

    // Validate take profits
    if (takeProfitPrices) {
      for (let i = 0; i < takeProfitPrices.length; i++) {
        const tp = Number(takeProfitPrices[i])
        if (tp > 0 && tp >= entry) {
          return {
            isValid: false,
            error: `Take profit ${i + 1} ($${tp.toFixed(2)}) must be below entry price ($${entry.toFixed(2)}) for SELL orders`
          }
        }
        
        // Check if TP2 is lower than TP1
        if (i === 1 && takeProfitPrices[0] > 0 && tp > 0 && tp >= takeProfitPrices[0]) {
          const tp1 = Number(takeProfitPrices[0])
          return {
            isValid: false,
            error: `Take profit 2 ($${tp.toFixed(2)}) must be lower than take profit 1 ($${tp1.toFixed(2)})`
          }
        }
      }
    }
  }

  return { isValid: true }
}

export function validatePriceUpdate(
  side: OrderSide,
  lineType: 'entry' | 'stop' | 'tp1' | 'tp2',
  newPrice: number,
  entryPrice: number,
  stopLossPrice?: number,
  takeProfitPrices?: number[]
): PriceValidationResult {
  // Create updated prices based on what's being changed
  let updatedEntry = entryPrice
  let updatedStopLoss = stopLossPrice
  let updatedTakeProfits = takeProfitPrices ? [...takeProfitPrices] : []

  switch (lineType) {
    case 'entry':
      updatedEntry = newPrice
      break
    case 'stop':
      updatedStopLoss = newPrice
      break
    case 'tp1':
      if (updatedTakeProfits.length === 0) updatedTakeProfits.push(0)
      updatedTakeProfits[0] = newPrice
      break
    case 'tp2':
      while (updatedTakeProfits.length < 2) updatedTakeProfits.push(0)
      updatedTakeProfits[1] = newPrice
      break
  }

  return validateBracketOrderPrices(side, updatedEntry, updatedStopLoss, updatedTakeProfits)
}