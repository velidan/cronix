# Feature Documentation

## Position Sizing & Risk Management

### Integrated Position Calculator Panel
The position calculator is displayed as a **dedicated panel** alongside the bracket order form in a two-column layout, providing better visibility and real-time calculations.

**Layout Design:**
- **Trading View**: Chart occupies 2/3 of screen width (2xl:col-span-2)
- **Control Panel**: Takes 1/3 of width (2xl:col-span-1) containing:
  - Bracket order form (left column)
  - Position calculator (right column)
  - Active orders list (below both)
- **Side-by-side arrangement**: Both forms visible simultaneously
- **Consistent styling**: Matching input heights (py-1.5) and text sizes (text-xs)
- **Responsive breakpoints**: Stacks vertically on smaller screens (< 2xl)

### Order Amount Field
The bracket order form includes a dedicated **Order Amount** field that allows traders to specify their investment in dollar terms rather than units.

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

### Position Size Calculator Panel

Advanced risk management tool displayed as a dedicated panel alongside the bracket order form.

**Features:**
1. **Account Balance Management**
   - Set your total trading capital
   - Persistent storage across sessions
   - Risk amount calculated automatically

2. **Risk Percentage Configuration**
   - Default: 0.25% of account per trade
   - Quick preset buttons:
     - Conservative: 0.25% (Shield icon)
     - Moderate: 0.5% (Lightning icon)
     - Aggressive: 1.0% (Flame icon)
   - Custom percentages supported

3. **Real-time Position Analysis**
   - Position value display
   - Entry price and quantity tracking
   - Live updates as form values change

4. **Stop Loss Analysis**
   - Visual risk status indicator (Conservative/Moderate/Aggressive/Over Limit)
   - Stop loss dollar amount calculation
   - Distance from entry in percentage
   - Warning when risk exceeds limit
   - Recommended position size for risk amount

5. **Take Profit Analysis**
   - Individual analysis for each take profit level
   - Dollar profit amount per level
   - Distance from entry in percentage
   - Risk/Reward ratio for each level
   - Color-coded R:R indicators

6. **Overall Risk/Reward Analysis**
   - Combined ratio display (1:X format)
   - Trade quality assessment
   - Color coding:
     - Green: R/R ≥ 2 (Excellent trade setup)
     - Yellow: R/R ≥ 1 (Acceptable trade setup)
     - Red: R/R < 1 (Poor risk/reward ratio)

**Visual Indicators:**
- **Risk Status Icons:**
  - 🛡️ Shield: Conservative risk level
  - ⚡ Lightning: Moderate risk level
  - 🔥 Flame: Aggressive risk level
  - ⚠️ Warning: Over risk limit

- **Panel Sections:**
  - Account settings (always visible)
  - Position information box
  - Stop loss analysis (red-tinted)
  - Take profit analysis (green-tinted per level)
  - Overall R/R summary (blue-tinted)
  - Warning alerts (orange-tinted)

**Example Calculation:**
```
Account: $10,000
Risk: 0.25% = $25
Entry: $100
Stop Loss: $95 (5% below)
Stop Distance: $5

Risk Amount = $10,000 × 0.25% = $25
Position Size = $25 ÷ $5 = 5 shares
Maximum Position Value = 5 × $100 = $500

If Take Profit at $110:
Profit = ($110 - $100) × 5 = $50
R/R Ratio = $50 ÷ $25 = 2.0 (Excellent)
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

## Layout & Space Optimization

### Dynamic Chart Height
The trading chart automatically adjusts its height to use all available vertical space.

**Implementation:**
- Minimum height: 600px
- Dynamic calculation: `window.innerHeight - 300`
- Responsive to window resize events
- Flex container with `flex-1` for optimal space usage

### Screen Width Utilization
The application now uses 95% of screen width instead of the previous max-w-7xl constraint.

**Benefits:**
- Better use of wide screens
- More space for chart analysis
- Improved visibility of multiple panels

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
   - Memoized calculations using `useMemo`
   - Prevented infinite loops in form change callbacks
   - Optimized useEffect dependencies
   - Proper null/undefined checks for all calculations

2. **Smart Updates**
   - Batch API calls when possible
   - Local state updates before server confirmation
   - Optimistic UI updates with rollback on error
   - Debounced form change notifications

3. **Type Safety**
   - Full TypeScript coverage
   - Runtime validation with Zod
   - Type-safe API contracts
   - Proper handling of optional values

## Technical Implementation Details

### Component Architecture
```
BracketOrderFormWithCalculator
├── BracketOrderForm (left column)
│   ├── Order type selection
│   ├── Entry configuration
│   ├── Risk management inputs
│   └── Form change callback → onFormChange
└── PositionCalculatorPanel (right column)
    ├── Account balance settings
    ├── Risk percentage configuration
    ├── Real-time position analysis
    └── Risk/reward calculations
```

### Data Flow
1. User inputs in BracketOrderForm
2. Form data memoized to prevent re-renders
3. onFormChange callback updates parent state
4. PositionCalculatorPanel receives updates via props
5. Calculator performs real-time risk analysis
6. Visual feedback updates immediately