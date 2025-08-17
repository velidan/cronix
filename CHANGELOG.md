# Changelog

## [Latest Updates] - 2024-01-16

### 🎯 New Features

#### Position Size Calculator & Risk Management
- **Order Amount Field**: New dedicated field in bracket order form to specify investment amount in dollars
  - Bidirectional sync with quantity field
  - Automatic calculation: Quantity = Order Amount ÷ Entry Price
  - Real-time updates as you type
  
- **Advanced Position Calculator**: Risk-based position sizing tool
  - Configurable risk percentage (default: 0.25% of account)
  - Risk level presets: Conservative (0.25%), Moderate (0.5%), Aggressive (1%)
  - Automatic position size calculation based on stop loss distance
  - Risk/Reward ratio display with color coding
  - Potential profit/loss preview
  - Persistent user preferences

- **Quick Price Setting**: 
  - Added "Use Current Price" button for entry price field
  - One-click to set entry price to current market price

#### Toast Notification System
- **Enterprise-Grade Notifications**: 
  - Success, error, warning, and info toast types
  - Configurable positions (top/bottom, left/center/right)
  - Auto-dismiss with customizable duration
  - Action buttons support
  - Smooth animations with Framer Motion
  - Maximum 5 toasts to prevent UI clutter

#### Enhanced Price Validation
- **Smart Validation System**:
  - Validates stop loss must be below entry for BUY orders
  - Validates stop loss must be above entry for SELL orders
  - Take profit validation relative to entry price
  - Clear error messages explaining validation failures
  
- **Drag & Drop Improvements**:
  - Real-time validation when dragging price lines
  - Automatic reversion to saved position on validation failure
  - Preserves original backend prices through multiple drags
  - Type-safe price handling (fixed string/number conversion issues)

### 🐛 Bug Fixes

- **Price Line Dragging**:
  - Fixed issue where invalid drag positions would persist after validation failure
  - Lines now properly revert to backend-saved positions
  - Fixed "toFixed is not a function" error
  - Fixed "price must be a number" error in lightweight-charts

- **Toast UI**:
  - Fixed deformed toast layout issues
  - Improved text wrapping and minimum width
  - Better spacing and responsive design

- **Order Updates**:
  - Fixed take profit update functionality
  - Proper handling of take profit levels array
  - Validation before API calls to prevent backend errors

### 🔧 Technical Improvements

- **State Management**:
  - New `riskManagementStore` with Zustand persist
  - Improved type safety across components
  - Better separation of concerns

- **Code Quality**:
  - Added comprehensive price validation utilities
  - Improved error handling with detailed messages
  - Better TypeScript type definitions
  - Cleaner component architecture

### 📚 Documentation

- Comprehensive inline documentation
- Updated component interfaces
- Clear usage examples in code

## Installation of New Dependencies

```bash
# Frontend
npm install framer-motion  # For toast animations
```

## Configuration

### Risk Management Settings
The system now persists user preferences for:
- Account balance
- Default risk percentage
- Selected risk level

These are stored in browser localStorage under `risk-management-storage`.

### Toast System Usage

```typescript
// Import the hook
import { useToast } from '../contexts/ToastContext'

// Use in component
const toast = useToast()

// Show notifications
toast.success('Order Created', 'Your order has been placed successfully')
toast.error('Validation Failed', 'Stop loss must be below entry price')
toast.warning('Partial Update', 'Some orders could not be updated')
toast.info('Market Update', 'Price has changed')
```

## Migration Notes

- No database migrations required
- Frontend will automatically use new features
- Existing orders remain compatible
- User preferences start with sensible defaults