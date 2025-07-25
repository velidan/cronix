# Cronix Implementation Notes

## 🚨 Important Session Notes

### Authentication Issue
- **Issue**: Bracket orders API returns 403 Forbidden even with valid demo token
- **Temporary Fix**: Authentication disabled for `/api/bracket-orders` endpoint for testing
- **Location**: `backend/app/api/bracket_orders.py:19` - commented out `credentials` parameter
- **TODO**: Re-enable authentication and fix token validation for bracket orders

### TradingView Charts Implementation
- **Library Used**: `lightweight-charts` (core library) - NOT the React wrapper
- **Reason**: React wrapper had import/export issues
- **Working Component**: `FinalTradingChart.tsx`
- **Key Pattern**: Uses callback ref instead of useRef for DOM element access

### Bracket Order System
- **Naming**: "Bracket Order" (industry standard) instead of "Complex Order"
- **Structure**: Entry (Market/Limit) + Optional Stop Loss + Optional Take Profits (up to 2)
- **Chart Integration**: Lines automatically added to chart when orders are created
- **Validation**: Smart price validation based on BUY/SELL side

## 🎯 Current Working Features

### Charts
- ✅ Professional candlestick charts with dark theme
- ✅ Real-time price updates (2-second intervals)
- ✅ Coin switching (8 pairs)
- ✅ Timeframe switching (7 timeframes)
- ✅ Trading line visualization
- ✅ OHLC data display
- ✅ **Fully draggable trading lines**
- ✅ **Real-time price updates during drag**
- ✅ **API integration for drag-to-update**

### Orders
- ✅ Bracket order form with BUY/SELL toggles
- ✅ Market vs Limit entry types
- ✅ Stop loss configuration
- ✅ Multiple take profit levels
- ✅ Automatic chart line creation
- ✅ Color-coded lines (Blue: Entry, Red: Stop, Green/Cyan: TPs)
- ✅ **Drag-to-modify order prices (Entry, Stop Loss, TP1, TP2)**
- ✅ **Live price updates saved to backend**

## 🔧 Technical Details

### Chart Component Structure
```
FinalTradingChart.tsx
├── Uses callback ref for DOM element access
├── Dynamic import of lightweight-charts
├── State management for chart instance
├── Automatic trading line visualization
└── Real-time price updates via store
```

### Bracket Order Flow
```
BracketOrderForm.tsx
├── Form validation with zod
├── Market/Limit toggle
├── BUY/SELL side selection
├── Optional stop loss and take profits
├── API call to create order
└── Automatic chart line addition
```

### API Structure
```
/api/bracket-orders/
├── POST / (create order)
├── GET / (list orders)
├── GET /{id} (get order)
├── DELETE /{id} (cancel order)
└── GET /{symbol}/market-price (get price)
```

## 🐛 Known Issues

1. **Authentication**: Bracket orders temporarily bypass auth
2. **Viewport Limitation**: Lines can't be dragged outside visible chart area (auto-scroll not implemented)
3. **Order Management**: No order cancellation from UI yet

## 🎮 Testing Instructions

1. **Login**: demo / demo
2. **Navigate**: Trading page
3. **Create Order**: Fill bracket order form
4. **Verify**: Lines appear on chart
5. **Check API**: http://localhost:8000/docs

## 📁 Key Files

### Backend
- `app/models/bracket_order.py` - Order data models
- `app/services/bracket_order_service.py` - Business logic
- `app/api/bracket_orders.py` - API endpoints

### Frontend
- `components/FinalTradingChart.tsx` - Chart component
- `components/BracketOrderForm.tsx` - Order form
- `types/bracketOrder.ts` - TypeScript types
- `services/bracketOrders.ts` - API client

## 🔄 For Next Session

### CRITICAL ISSUE TO SOLVE TOMORROW ⚠️
**CHART PANNING BUG**: After dragging a trading line and releasing it, the chart continues to pan/move with the mouse cursor as if the user is still holding down the mouse button. This makes the interface unusable.

**Attempted Solutions (ALL FAILED)**:
1. ✗ Event propagation control (`preventDefault`, `stopPropagation`, `stopImmediatePropagation`)
2. ✗ Proper event listener binding and cleanup (using bound methods)
3. ✗ Global mouse up listeners to catch releases outside chart
4. ✗ Disabling chart options (`handleScroll: false`, `handleScale: false`) during drag
5. ✗ DOM pointer events manipulation (`pointerEvents: 'none'`)

**Research Areas for Tomorrow**:
- TradingView Lightweight Charts interaction system internals
- Alternative drag implementation approaches (custom overlay, different event handling)
- Chart container event bubbling issues
- Mouse capture/release patterns for chart libraries

**Files Involved**:
- `/frontend/src/components/DraggablePriceLinesPlugin.ts` (main plugin)
- `/frontend/src/components/FinalTradingChart.tsx` (integration)

### Priority 1: System Improvements
1. **Fix Authentication**: Re-enable and fix bracket order auth
2. **Order Management**: Add order list and cancellation UI
3. **Real KuCoin**: Connect to actual KuCoin API
4. **Database**: Add PostgreSQL for order persistence
5. **WebSocket**: Real-time order updates