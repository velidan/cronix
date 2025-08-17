import { useState } from 'react'
import BracketOrderForm from './BracketOrderForm'
import PositionCalculatorPanel from './PositionCalculatorPanel'

const BracketOrderFormWithCalculator = () => {
  // State to track form values for the calculator
  const [formData, setFormData] = useState({
    entryPrice: 0,
    stopLossPrice: null as number | null,
    takeProfitLevels: [] as Array<{ price: number; quantity: number }>,
    quantity: 0,
    side: 'buy' as 'buy' | 'sell',
    entryType: 'market' as 'market' | 'limit'
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* Left Column: Bracket Order Form */}
      <BracketOrderForm onFormChange={setFormData} />
      
      {/* Right Column: Position Calculator Panel */}
      <PositionCalculatorPanel
        entryPrice={formData.entryPrice}
        stopLossPrice={formData.stopLossPrice}
        takeProfitLevels={formData.takeProfitLevels}
        quantity={formData.quantity}
        side={formData.side}
        entryType={formData.entryType}
      />
    </div>
  )
}

export default BracketOrderFormWithCalculator