import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'

interface PriceUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  lineType: string
  oldPrice: number
  newPrice: number
  symbol: string
}

const PriceUpdateModal = ({
  isOpen,
  onClose,
  onConfirm,
  lineType,
  oldPrice,
  newPrice,
  symbol
}: PriceUpdateModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsUpdating(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Failed to update price:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getLineTypeDisplay = (type: string) => {
    switch (type) {
      case 'entry': return 'Entry Price'
      case 'stop-loss': return 'Stop Loss'
      case 'take-profit-1': return 'Take Profit 1'
      case 'take-profit-2': return 'Take Profit 2'
      default: return 'Price'
    }
  }

  const getLineColor = (type: string) => {
    switch (type) {
      case 'entry': return 'text-blue-400'
      case 'stop-loss': return 'text-red-400'
      case 'take-profit-1': return 'text-green-400'
      case 'take-profit-2': return 'text-cyan-400'
      default: return 'text-foreground'
    }
  }

  const priceChange = newPrice - oldPrice
  const isIncrease = priceChange > 0

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
            Update {getLineTypeDisplay(lineType)}
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
            <p className="text-sm text-muted-foreground mb-2">
              {symbol} {getLineTypeDisplay(lineType)}
            </p>
            
            {/* Price Change Visualization */}
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="text-lg font-mono text-foreground">
                  ${oldPrice.toFixed(2)}
                </p>
              </div>
              
              <div className="flex items-center">
                <div className={`w-8 h-0.5 ${isIncrease ? 'bg-green-400' : 'bg-red-400'}`} />
                <div className={`w-0 h-0 border-l-4 border-r-0 border-t-2 border-b-2 border-transparent ${
                  isIncrease ? 'border-l-green-400' : 'border-l-red-400'
                }`} />
              </div>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">New</p>
                <p className={`text-lg font-mono font-semibold ${getLineColor(lineType)}`}>
                  ${newPrice.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Price Change Amount */}
            <div className="mt-3 text-center">
              <p className={`text-sm font-medium ${isIncrease ? 'text-green-400' : 'text-red-400'}`}>
                {isIncrease ? '+' : ''}${priceChange.toFixed(2)} ({((priceChange / oldPrice) * 100).toFixed(2)}%)
              </p>
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
            {isUpdating ? 'Updating...' : 'Apply Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PriceUpdateModal