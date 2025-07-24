from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional

from ..models.bracket_order import (
    BracketOrderCreate,
    BracketOrderResponse,
    BracketOrderUpdate,
    BracketOrderValidationError
)
from ..services.bracket_order_service import bracket_order_service

router = APIRouter()
security = HTTPBearer()

@router.post("/", response_model=BracketOrderResponse)
async def create_bracket_order(
    order: BracketOrderCreate,
    # credentials: HTTPAuthorizationCredentials = Depends(security)  # Temporarily disabled for testing
):
    """Create a new bracket order"""
    try:
        bracket_order = bracket_order_service.create_bracket_order(order)
        return bracket_order
    except BracketOrderValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create bracket order: {str(e)}"
        )

@router.get("/", response_model=List[BracketOrderResponse])
async def get_bracket_orders(
    symbol: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get all bracket orders, optionally filtered by symbol"""
    try:
        orders = bracket_order_service.get_bracket_orders(symbol=symbol)
        return orders
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve bracket orders: {str(e)}"
        )

@router.get("/{order_id}", response_model=BracketOrderResponse)
async def get_bracket_order(
    order_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get a specific bracket order by ID"""
    order = bracket_order_service.get_bracket_order(order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bracket order not found"
        )
    return order

@router.put("/{order_id}", response_model=BracketOrderResponse)
async def update_bracket_order(
    order_id: str,
    updates: BracketOrderUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Update a bracket order (only for pending orders)"""
    try:
        updated_order = bracket_order_service.update_bracket_order(order_id, updates)
        if not updated_order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bracket order not found or cannot be updated"
            )
        return updated_order
    except BracketOrderValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update bracket order: {str(e)}"
        )

@router.delete("/{order_id}")
async def cancel_bracket_order(
    order_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Cancel a bracket order"""
    try:
        success = bracket_order_service.cancel_bracket_order(order_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bracket order not found or cannot be cancelled"
            )
        return {"message": f"Bracket order {order_id} cancelled successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel bracket order: {str(e)}"
        )

@router.get("/{symbol}/market-price")
async def get_market_price(
    symbol: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get current market price for a symbol"""
    try:
        price = bracket_order_service.get_current_market_price(symbol)
        return {"symbol": symbol, "price": str(price)}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get market price: {str(e)}"
        )