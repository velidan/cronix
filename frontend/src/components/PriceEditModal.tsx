import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'

interface PriceEditModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (newPrice: number) => void
  lineType: string
  currentPrice: number
  symbol: string
}

const PriceEditModal = ({
  isOpen,
  onClose,
  onConfirm,
  lineType,
  currentPrice,
  symbol
}: PriceEditModalProps) => {
  const [newPrice, setNewPrice] = useState(Number(currentPrice).toString())
  const [isUpdating, setIsUpdating] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    const price = parseFloat(newPrice)
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price')
      return
    }

    setIsUpdating(true)
    try {
      await onConfirm(price)
      onClose()
    } catch (error) {
      console.error('Failed to update price:', error)
      alert('Failed to update price')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const getLineTypeDisplay = (type: string) => {
    switch (type) {
      case 'entry': return 'Entry Price'
      case 'stop': return 'Stop Loss'
      case 'tp1': return 'Take Profit 1'
      case 'tp2': return 'Take Profit 2'
      default: return 'Price'
    }
  }

  const getLineColor = (type: string) => {
    switch (type) {
      case 'entry': return 'text-blue-400'
      case 'stop': return 'text-red-400'
      case 'tp1': return 'text-green-400'
      case 'tp2': return 'text-cyan-400'
      default: return 'text-foreground'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Edit {getLineTypeDisplay(lineType)}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {symbol} {getLineTypeDisplay(lineType)}
            </p>
            
            {/* Current Price Display */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground">Current Price</p>
              <p className={`text-lg font-mono ${getLineColor(lineType)}`}>
                ${Number(currentPrice).toFixed(2)}
              </p>
            </div>

            {/* New Price Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                New Price
              </label>
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter new price"
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isUpdating}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isUpdating ? 'Updating...' : 'Apply'}
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Press Enter to apply, Escape to cancel
        </p>
      </div>
    </div>
  )
}

export default PriceEditModal