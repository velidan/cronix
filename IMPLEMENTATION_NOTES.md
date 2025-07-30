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

### COMPLETED TODAY ✅
**CHART PANNING BUG**: Fixed! The issue was resolved by:
1. Properly managing chart interaction state during drag operations
2. Using `disableChartInteractions()` and `enableChartInteractions()` methods
3. Forcing chart update with synthetic mouse event after drag ends
4. Removing `stopPropagation()` calls that were interfering with chart's event system

**ORDER MANAGEMENT**: Implemented comprehensive order and line management:
1. Redesigned Trading Controls to show orders instead of individual lines
2. Added ability to cancel individual lines (SL, TP1, TP2)
3. Fixed bug where canceling TP would also remove stop loss
4. Fixed 500 errors when deleting non-existent orders

### TOMORROW'S PRIORITY FEATURE 🎯
**RE-ADD CANCELLED LINES**: After canceling SL/TP1/TP2, users need ability to add them back.

**UX Options to Consider**:
1. **Option 1 - Order Card Buttons**: Add "+" buttons in order card for missing lines
   - Pros: Clear, discoverable, follows existing UI patterns
   - Cons: Requires modal/input for price entry

2. **Option 2 - Chart Right-Click**: Right-click on chart to add line at that price
   - Pros: Direct price selection, intuitive for traders
   - Cons: Not mobile-friendly, less discoverable

3. **Option 3 - Floating Action Button**: FAB with line type selection
   - Pros: Always accessible, mobile-friendly
   - Cons: Additional UI element, requires price input

4. **Option 4 - Order Edit Mode**: Toggle edit mode with checkboxes
   - Pros: Batch operations, clear state
   - Cons: More complex interaction model

**Technical Requirements**:
- New API endpoint to add individual lines to existing orders
- Validation logic (SL below/above entry based on side)
- Real-time chart update when lines are added
- Maintain order integrity and validation rules

### Priority 2: System Improvements
1. **Fix Authentication**: Re-enable and fix bracket order auth
2. **Real KuCoin**: Connect to actual KuCoin API
3. **Database**: Add PostgreSQL for order persistence
4. **WebSocket**: Real-time order updates