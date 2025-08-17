# Feature Documentation

## Position Sizing & Risk Management

### Order Amount Field
The bracket order form now includes a dedicated **Order Amount** field that allows traders to specify their investment in dollar terms rather than units.

**How it works:**
- Enter a dollar amount (e.g., $100)
- System automatically calculates the quantity based on current/limit price
- Bidirectional sync: changing quantity updates amount, and vice versa
- Real-time calculations as you type

**Example:**
```
BTC Price: $40,000
Order Amount: $100
Calculated Quantity: 0.0025 BTC
```

### Position Size Calculator

Advanced risk management tool accessible via the calculator icon in the bracket order form.

**Features:**
1. **Account Balance Management**
   - Set your total trading capital
   - Persistent storage across sessions

2. **Risk Percentage Configuration**
   - Default: 0.25% of account per trade
   - Presets available:
     - Conservative: 0.25% (Shield icon)
     - Moderate: 0.5% (Lightning icon)
     - Aggressive: 1.0% (Flame icon)
   - Custom percentages supported

3. **Automatic Position Sizing**
   - Formula: `Position Size = Risk Amount ÷ Stop Loss Distance`
   - Ensures maximum loss equals your risk tolerance
   - Updates in real-time with price changes

4. **Risk/Reward Analysis**
   - Visual ratio display (1:X format)
   - Color coding:
     - Green: R/R > 2 (Excellent)
     - Yellow: R/R > 1 (Good)
     - Red: R/R < 1 (Poor)

**Example Calculation:**
```
Account: $10,000
Risk: 0.25% = $25
Entry: $100
Stop Loss: $95 (5% below)
Stop Distance: $5

Position Size = $25 ÷ $5 = 5 shares
Maximum Position Value = 5 × $100 = $500
```

## Toast Notification System

Professional notification system providing real-time feedback for all user actions.

### Toast Types
- **Success** (Green): Confirmations of successful actions
- **Error** (Red): Error messages with details
- **Warning** (Yellow): Important notices
- **Info** (Blue): General information

### Features
- Auto-dismiss after 5 seconds (7 seconds for errors)
- Maximum 5 toasts displayed simultaneously
- Smooth enter/exit animations
- Dismissible with X button
- Action buttons for quick responses

### Usage Examples
```typescript
// Success notification
toast.success('Order Placed', 'Buy order for 0.5 BTC executed')

// Error with details
toast.error('Invalid Configuration', 'Stop loss must be below entry price for BUY orders')

// Warning for partial success
toast.warning('Partial Update', '2 orders updated, 1 failed validation')
```

## Price Line Validation

### Smart Validation Rules

**BUY Orders:**
- Stop Loss must be below Entry Price
- Take Profit must be above Entry Price
- TP2 must be higher than TP1

**SELL Orders:**
- Stop Loss must be above Entry Price
- Take Profit must be below Entry Price
- TP2 must be lower than TP1

### Drag & Drop Enhancements

1. **Real-time Validation**
   - Validates price configurations before applying changes
   - Shows clear error messages for invalid configurations

2. **Smart Reversion**
   - Invalid drags revert to last saved backend position
   - Not just the previous drag position
   - Ensures consistency with database

3. **Visual Feedback**
   - Pending changes shown with different styling
   - Apply/Cancel buttons for batch updates
   - Individual line edit/cancel options

### Validation Examples

**Invalid BUY Order:**
```
Entry: $40,000
Stop Loss: $41,000 ❌ (Above entry)
Error: "Stop loss ($41,000) must be below entry price ($40,000) for BUY orders"
```

**Valid BUY Order:**
```
Entry: $40,000
Stop Loss: $38,000 ✅ (Below entry)
Take Profit 1: $42,000 ✅ (Above entry)
Take Profit 2: $44,000 ✅ (Above TP1)
```

## Quick Actions

### Current Price Button
Located next to the entry price field, this button allows one-click setting of the entry price to the current market price.

**Icon:** Activity (lightning bolt)
**Tooltip:** "Use current market price"
**Behavior:** Sets entry price to latest candle close price

## Data Persistence

### Saved User Preferences
The following settings are stored in browser localStorage:

1. **Risk Management Settings** (`risk-management-storage`)
   - Total deposit/account balance
   - Default risk percentage
   - Selected risk level preset

2. **Trading Preferences**
   - Last used symbol
   - Preferred order type
   - Chart settings

### Session Management
- Preferences persist across browser sessions
- No server-side storage required
- Clear via browser settings if needed

## Error Handling

### Comprehensive Error Messages
All errors now provide:
- Clear description of the problem
- Specific values causing the issue
- Suggested resolution

### API Error Handling
- Backend validation errors displayed in toast
- Network errors with retry suggestions
- Timeout handling for long operations

## Performance Optimizations

1. **Efficient Re-renders**
   - Memoized calculations
   - Debounced input handlers
   - Optimized useEffect dependencies

2. **Smart Updates**
   - Batch API calls when possible
   - Local state updates before server confirmation
   - Optimistic UI updates with rollback on error

3. **Type Safety**
   - Full TypeScript coverage
   - Runtime validation with Zod
   - Type-safe API contracts