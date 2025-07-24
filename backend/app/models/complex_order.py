from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from enum import Enum
from datetime import datetime

class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"

class OrderStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

class ComplexOrderCreate(BaseModel):
    """Complex order creation request"""
    symbol: str
    side: OrderSide
    quantity: Decimal
    
    # Entry (limit order)
    entry_price: Decimal
    
    # Risk management (optional)
    stop_loss_price: Optional[Decimal] = None
    
    # Profit targets (optional)
    take_profit_1_price: Optional[Decimal] = None
    take_profit_1_quantity: Optional[Decimal] = None  # Percentage of total quantity
    
    take_profit_2_price: Optional[Decimal] = None
    take_profit_2_quantity: Optional[Decimal] = None  # Percentage of total quantity

class ComplexOrderResponse(BaseModel):
    """Complex order response"""
    id: str
    symbol: str
    side: OrderSide
    quantity: Decimal
    status: OrderStatus
    created_at: datetime
    
    # Entry order
    entry_price: Decimal
    entry_order_id: Optional[str] = None
    entry_filled_quantity: Decimal = Decimal("0")
    
    # Stop loss
    stop_loss_price: Optional[Decimal] = None
    stop_loss_order_id: Optional[str] = None
    
    # Take profit levels
    take_profit_1_price: Optional[Decimal] = None
    take_profit_1_quantity: Optional[Decimal] = None
    take_profit_1_order_id: Optional[str] = None
    take_profit_1_filled_quantity: Decimal = Decimal("0")
    
    take_profit_2_price: Optional[Decimal] = None
    take_profit_2_quantity: Optional[Decimal] = None
    take_profit_2_order_id: Optional[str] = None
    take_profit_2_filled_quantity: Decimal = Decimal("0")
    
    # Calculated fields
    total_filled_quantity: Decimal = Decimal("0")
    average_fill_price: Optional[Decimal] = None
    total_pnl: Optional[Decimal] = None

class ComplexOrderUpdate(BaseModel):
    """Update complex order"""
    entry_price: Optional[Decimal] = None
    stop_loss_price: Optional[Decimal] = None
    take_profit_1_price: Optional[Decimal] = None
    take_profit_2_price: Optional[Decimal] = None
    
class OrderValidationError(Exception):
    """Custom exception for order validation errors"""
    pass