from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from enum import Enum
from datetime import datetime

class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"

class EntryType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"

class OrderStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

class TakeProfitLevel(BaseModel):
    """Individual take profit level"""
    price: Decimal
    quantity: Decimal  # Absolute quantity (not percentage)
    order_id: Optional[str] = None
    filled_quantity: Decimal = Decimal("0")

class BracketOrderCreate(BaseModel):
    """Bracket order creation request"""
    symbol: str
    side: OrderSide
    quantity: Decimal
    
    # Entry configuration
    entry_type: EntryType
    entry_price: Optional[Decimal] = None  # Required for LIMIT, ignored for MARKET
    
    # Risk management (optional)
    stop_loss_price: Optional[Decimal] = None
    
    # Profit targets (optional)
    take_profit_levels: List[TakeProfitLevel] = []

class BracketOrderResponse(BaseModel):
    """Bracket order response"""
    id: str
    symbol: str
    side: OrderSide
    quantity: Decimal
    status: OrderStatus
    created_at: datetime
    
    # Entry configuration
    entry_type: EntryType
    entry_price: Optional[Decimal] = None
    entry_order_id: Optional[str] = None
    entry_filled_quantity: Decimal = Decimal("0")
    entry_average_price: Optional[Decimal] = None
    
    # Stop loss
    stop_loss_price: Optional[Decimal] = None
    stop_loss_order_id: Optional[str] = None
    
    # Take profit levels
    take_profit_levels: List[TakeProfitLevel] = []
    
    # Calculated fields
    total_filled_quantity: Decimal = Decimal("0")
    remaining_quantity: Decimal = Decimal("0")
    total_pnl: Optional[Decimal] = None
    
    class Config:
        json_encoders = {
            Decimal: str,
            datetime: lambda dt: dt.isoformat()
        }

class BracketOrderUpdate(BaseModel):
    """Update bracket order (only for pending orders)"""
    entry_price: Optional[Decimal] = None
    stop_loss_price: Optional[Decimal] = None
    take_profit_levels: Optional[List[TakeProfitLevel]] = None
    
    class Config:
        # Only include fields that are explicitly set
        fields = {
            'entry_price': {'exclude_unset': True},
            'stop_loss_price': {'exclude_unset': True},
            'take_profit_levels': {'exclude_unset': True}
        }

class BracketOrderValidationError(Exception):
    """Custom exception for bracket order validation errors"""
    pass