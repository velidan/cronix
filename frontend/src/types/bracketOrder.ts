export enum OrderSide {
  BUY = "buy",
  SELL = "sell"
}

export enum EntryType {
  MARKET = "market",
  LIMIT = "limit"
}

export enum OrderStatus {
  PENDING = "pending",
  ACTIVE = "active",
  PARTIALLY_FILLED = "partially_filled",
  FILLED = "filled",
  CANCELLED = "cancelled",
  REJECTED = "rejected"
}

export interface TakeProfitLevel {
  price: number
  quantity: number
  order_id?: string
  filled_quantity?: number
}

export interface BracketOrderCreate {
  symbol: string
  side: OrderSide
  quantity: number
  
  // Entry configuration
  entry_type: EntryType
  entry_price?: number // Required for LIMIT, ignored for MARKET
  
  // Risk management (optional)
  stop_loss_price?: number
  
  // Profit targets (optional)
  take_profit_levels: TakeProfitLevel[]
}

export interface BracketOrderResponse {
  id: string
  symbol: string
  side: OrderSide
  quantity: number
  status: OrderStatus
  created_at: string
  
  // Entry configuration
  entry_type: EntryType
  entry_price?: number
  entry_order_id?: string
  entry_filled_quantity: number
  entry_average_price?: number
  
  // Stop loss
  stop_loss_price?: number
  stop_loss_order_id?: string
  
  // Take profit levels
  take_profit_levels: TakeProfitLevel[]
  
  // Calculated fields
  total_filled_quantity: number
  remaining_quantity: number
  total_pnl?: number
}

export interface BracketOrderFormData {
  symbol: string
  side: OrderSide
  quantity: string
  entry_type: EntryType
  entry_price: string
  stop_loss_price: string
  take_profit_1_price: string
  take_profit_1_quantity: string
  take_profit_2_price: string
  take_profit_2_quantity: string
}