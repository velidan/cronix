from typing import List, Optional
from decimal import Decimal
import uuid
from datetime import datetime

from ..models.bracket_order import (
    BracketOrderCreate,
    BracketOrderResponse,
    BracketOrderUpdate,
    TakeProfitLevel,
    OrderStatus,
    OrderSide,
    EntryType,
    BracketOrderValidationError
)

class BracketOrderService:
    def __init__(self):
        # In-memory storage for demo (replace with database in production)
        self.orders: dict[str, BracketOrderResponse] = {}
    
    def validate_bracket_order(self, order: BracketOrderCreate) -> None:
        """Validate bracket order before creation"""
        
        # Basic validations
        if order.quantity <= 0:
            raise BracketOrderValidationError("Quantity must be positive")
        
        # Entry price validation
        if order.entry_type == EntryType.LIMIT:
            if not order.entry_price or order.entry_price <= 0:
                raise BracketOrderValidationError("Entry price is required for limit orders")
        
        # Get reference price for validation (entry price for limit, assume current market for market)
        reference_price = order.entry_price if order.entry_type == EntryType.LIMIT else None
        
        if reference_price:
            # Side-specific validations for limit orders
            if order.side == OrderSide.BUY:
                # For buy orders, stop loss should be below entry, take profits above
                if order.stop_loss_price and order.stop_loss_price >= reference_price:
                    raise BracketOrderValidationError("Stop loss must be below entry price for buy orders")
                
                # Take profits should be above entry price
                for i, tp in enumerate(order.take_profit_levels):
                    if tp.price <= reference_price:
                        raise BracketOrderValidationError(f"Take profit {i+1} must be above entry price for buy orders")
            
            else:  # SELL orders
                # For sell orders, stop loss should be above entry, take profits below
                if order.stop_loss_price and order.stop_loss_price <= reference_price:
                    raise BracketOrderValidationError("Stop loss must be above entry price for sell orders")
                
                # Take profits should be below entry price
                for i, tp in enumerate(order.take_profit_levels):
                    if tp.price >= reference_price:
                        raise BracketOrderValidationError(f"Take profit {i+1} must be below entry price for sell orders")
        
        # Take profit levels validation
        if len(order.take_profit_levels) > 3:
            raise BracketOrderValidationError("Maximum 3 take profit levels allowed")
        
        # Validate take profit quantities
        total_tp_quantity = Decimal("0")
        for i, tp in enumerate(order.take_profit_levels):
            if tp.quantity <= 0:
                raise BracketOrderValidationError(f"Take profit {i+1} quantity must be positive")
            if tp.price <= 0:
                raise BracketOrderValidationError(f"Take profit {i+1} price must be positive")
            total_tp_quantity += tp.quantity
        
        if total_tp_quantity > order.quantity:
            raise BracketOrderValidationError("Total take profit quantities cannot exceed order quantity")
        
        # Validate take profit price ordering
        if len(order.take_profit_levels) > 1:
            sorted_tps = sorted(order.take_profit_levels, key=lambda x: x.price)
            
            if order.side == OrderSide.BUY:
                # For buy orders, TP prices should increase
                if sorted_tps != order.take_profit_levels:
                    raise BracketOrderValidationError("Take profit levels should be ordered from lowest to highest price for buy orders")
            else:
                # For sell orders, TP prices should decrease
                if sorted_tps != list(reversed(order.take_profit_levels)):
                    raise BracketOrderValidationError("Take profit levels should be ordered from highest to lowest price for sell orders")
    
    def create_bracket_order(self, order: BracketOrderCreate) -> BracketOrderResponse:
        """Create a new bracket order"""
        
        # Validate the order
        self.validate_bracket_order(order)
        
        # Generate unique ID
        order_id = str(uuid.uuid4())
        
        # Calculate remaining quantity
        remaining_quantity = order.quantity
        
        # Create the bracket order response
        bracket_order = BracketOrderResponse(
            id=order_id,
            symbol=order.symbol,
            side=order.side,
            quantity=order.quantity,
            status=OrderStatus.PENDING,
            created_at=datetime.utcnow(),
            
            # Entry configuration
            entry_type=order.entry_type,
            entry_price=order.entry_price,
            
            # Stop loss
            stop_loss_price=order.stop_loss_price,
            
            # Take profit levels
            take_profit_levels=order.take_profit_levels.copy(),
            
            # Calculated fields
            remaining_quantity=remaining_quantity,
        )
        
        # Store the order
        self.orders[order_id] = bracket_order
        
        # In a real implementation, you would:
        # 1. Place the entry order (market or limit) with KuCoin
        # 2. Set up monitoring for the entry order fill
        # 3. When entry fills, place stop loss and take profit orders
        # 4. Monitor and manage the entire bracket
        
        print(f"Created bracket order: {order_id} for {order.symbol} {order.side} {order.quantity}")
        
        return bracket_order
    
    def get_bracket_order(self, order_id: str) -> Optional[BracketOrderResponse]:
        """Get a bracket order by ID"""
        return self.orders.get(order_id)
    
    def get_bracket_orders(self, symbol: Optional[str] = None) -> List[BracketOrderResponse]:
        """Get all bracket orders, optionally filtered by symbol"""
        orders = list(self.orders.values())
        
        if symbol:
            orders = [order for order in orders if order.symbol == symbol]
        
        # Sort by creation date, newest first
        orders.sort(key=lambda x: x.created_at, reverse=True)
        
        return orders
    
    def cancel_bracket_order(self, order_id: str) -> bool:
        """Cancel a bracket order"""
        if order_id not in self.orders:
            return False
        
        order = self.orders[order_id]
        
        # Only allow cancellation of pending/active orders
        if order.status in [OrderStatus.FILLED, OrderStatus.CANCELLED]:
            return False
        
        # Update status
        order.status = OrderStatus.CANCELLED
        
        # In a real implementation, you would:
        # 1. Cancel all related orders in KuCoin
        # 2. Update the database
        
        print(f"Cancelled bracket order: {order_id}")
        
        return True
    
    def update_bracket_order(self, order_id: str, updates: BracketOrderUpdate) -> Optional[BracketOrderResponse]:
        """Update a bracket order (prices only for pending orders)"""
        if order_id not in self.orders:
            return None
        
        order = self.orders[order_id]
        
        # Only allow updates for pending orders
        if order.status != OrderStatus.PENDING:
            return None
        
        # Update allowed fields
        if updates.entry_price is not None:
            order.entry_price = updates.entry_price
        
        if updates.stop_loss_price is not None:
            order.stop_loss_price = updates.stop_loss_price
        
        if updates.take_profit_levels is not None:
            order.take_profit_levels = updates.take_profit_levels
        
        # Re-validate after updates
        order_create = BracketOrderCreate(
            symbol=order.symbol,
            side=order.side,
            quantity=order.quantity,
            entry_type=order.entry_type,
            entry_price=order.entry_price,
            stop_loss_price=order.stop_loss_price,
            take_profit_levels=order.take_profit_levels,
        )
        
        self.validate_bracket_order(order_create)
        
        print(f"Updated bracket order: {order_id}")
        
        return order
    
    def get_current_market_price(self, symbol: str) -> Decimal:
        """Get current market price for validation (mock implementation)"""
        # Mock prices for different symbols
        mock_prices = {
            "BTC-USDT": Decimal("45000"),
            "ETH-USDT": Decimal("3000"),
            "BNB-USDT": Decimal("300"),
            "ADA-USDT": Decimal("0.5"),
            "SOL-USDT": Decimal("100"),
            "DOT-USDT": Decimal("7"),
            "MATIC-USDT": Decimal("0.8"),
            "LINK-USDT": Decimal("15"),
        }
        return mock_prices.get(symbol, Decimal("100"))

# Global instance
bracket_order_service = BracketOrderService()