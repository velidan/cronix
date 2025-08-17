import { useEffect, useState } from 'react'
import { Shield, Zap, Flame, TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle } from 'lucide-react'
import { useRiskManagementStore } from '../store/riskManagementStore'
import { useTradingStore } from '../store/tradingStore'

interface PositionCalculatorPanelProps {
  entryPrice: number
  stopLossPrice: number | null
  takeProfitLevels: Array<{ price: number; quantity: number }>
  quantity: number
  side: 'buy' | 'sell'
  entryType: 'market' | 'limit'
}

const PositionCalculatorPanel = ({
  entryPrice,
  stopLossPrice,
  takeProfitLevels,
  quantity,
  side,
  entryType
}: PositionCalculatorPanelProps) => {
  const { currentPrice } = useTradingStore()
  const {
    totalDeposit,
    defaultRiskPercentage,
    selectedRiskLevel,
    setTotalDeposit,
    setDefaultRiskPercentage,
    setSelectedRiskLevel,
    calculateRiskAmount,
    calculatePositionSize,
    calculateRiskRewardRatio,
  } = useRiskManagementStore()

  const [localDeposit, setLocalDeposit] = useState((totalDeposit || 10000).toString())
  const [localRiskPercentage, setLocalRiskPercentage] = useState((defaultRiskPercentage || 0.25).toString())

  // Use current price if market order or no entry price
  const effectiveEntryPrice = entryType === 'market' || !entryPrice ? (currentPrice || 0) : (entryPrice || 0)
  
  // Calculate derived values
  const positionValue = (quantity || 0) * effectiveEntryPrice
  const riskAmount = calculateRiskAmount(parseFloat(localRiskPercentage) || 0.25)
  
  // Calculate stop loss distance and dollar amount
  const stopLossDistance = stopLossPrice && effectiveEntryPrice > 0 ? Math.abs(effectiveEntryPrice - stopLossPrice) : 0
  const stopLossDollarAmount = stopLossDistance * (quantity || 0)
  const stopLossPercentage = stopLossPrice && effectiveEntryPrice > 0 ? (stopLossDistance / effectiveEntryPrice) * 100 : 0
  
  // Calculate recommended position size based on risk
  const recommendedPositionSize = stopLossPrice && effectiveEntryPrice > 0
    ? calculatePositionSize(effectiveEntryPrice, stopLossPrice, parseFloat(localRiskPercentage) || 0.25)
    : 0
  const recommendedPositionValue = recommendedPositionSize * effectiveEntryPrice
  
  // Calculate take profit distances and dollar amounts
  const takeProfitCalculations = takeProfitLevels.map((tp, index) => {
    const distance = effectiveEntryPrice > 0 ? Math.abs(tp.price - effectiveEntryPrice) : 0
    const dollarAmount = distance * (tp.quantity || quantity || 0)
    const percentage = effectiveEntryPrice > 0 ? (distance / effectiveEntryPrice) * 100 : 0
    const rrRatio = stopLossDistance > 0 ? distance / stopLossDistance : 0
    return {
      index: index + 1,
      price: tp.price,
      distance,
      dollarAmount,
      percentage,
      rrRatio
    }
  })
  
  // Calculate overall risk/reward ratio (using first TP)
  const overallRR = takeProfitLevels.length > 0 && stopLossPrice && effectiveEntryPrice > 0
    ? calculateRiskRewardRatio(effectiveEntryPrice, stopLossPrice, takeProfitLevels[0].price)
    : 0

  // Determine risk level status
  const getRiskStatus = () => {
    if (!stopLossPrice) return { color: 'text-gray-500', label: 'No Stop Loss', icon: AlertTriangle }
    if (stopLossDollarAmount > riskAmount) {
      return { color: 'text-red-400', label: 'Over Risk Limit', icon: AlertTriangle }
    }
    if (stopLossDollarAmount <= riskAmount * 0.5) {
      return { color: 'text-green-400', label: 'Conservative', icon: Shield }
    }
    if (stopLossDollarAmount <= riskAmount * 0.75) {
      return { color: 'text-yellow-400', label: 'Moderate', icon: Zap }
    }
    return { color: 'text-orange-400', label: 'Aggressive', icon: Flame }
  }

  const riskStatus = getRiskStatus()
  const RiskIcon = riskStatus.icon

  // Risk level presets
  const riskPresets = [
    { value: 0.25, label: 'Conservative', icon: Shield, color: 'text-green-400' },
    { value: 0.5, label: 'Moderate', icon: Zap, color: 'text-yellow-400' },
    { value: 1.0, label: 'Aggressive', icon: Flame, color: 'text-orange-400' },
  ]

  useEffect(() => {
    if (totalDeposit) {
      setLocalDeposit(totalDeposit.toString())
    }
  }, [totalDeposit])

  useEffect(() => {
    if (defaultRiskPercentage) {
      setLocalRiskPercentage(defaultRiskPercentage.toString())
    }
  }, [defaultRiskPercentage])

  const handleDepositChange = (value: string) => {
    setLocalDeposit(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setTotalDeposit(numValue)
    }
  }

  const handleRiskPercentageChange = (value: string) => {
    setLocalRiskPercentage(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0 && numValue <= 100) {
      setDefaultRiskPercentage(numValue)
      setSelectedRiskLevel(-1) // Custom
    }
  }

  const selectRiskPreset = (preset: typeof riskPresets[0]) => {
    setDefaultRiskPercentage(preset.value)
    setSelectedRiskLevel(preset.value)
    setLocalRiskPercentage(preset.value.toString())
  }

  return (
    <div className="bg-slate-900/80 rounded-lg border border-white/10 p-2.5 space-y-2">
      <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
        <DollarSign className="h-3.5 w-3.5 text-blue-400" />
        Position Calculator
      </h3>
      
      {/* Account & Risk Settings */}
      <div className="space-y-2">
        <div>
          <label className="text-xs text-gray-400">Account Balance</label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={localDeposit}
              onChange={(e) => handleDepositChange(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded px-6 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="10000"
            />
          </div>
        </div>
        
        <div>
          <label className="text-xs text-gray-400">Risk per Trade</label>
          <div className="flex gap-1">
            <div className="relative flex-1">
              <input
                type="number"
                value={localRiskPercentage}
                onChange={(e) => handleRiskPercentageChange(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                step="0.1"
                min="0.1"
                max="100"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
            <div className="flex gap-0.5">
              {riskPresets.map((preset) => {
                const Icon = preset.icon
                return (
                  <button
                    key={preset.value}
                    onClick={() => selectRiskPreset(preset)}
                    className={`p-1.5 rounded transition-colors ${
                      selectedRiskLevel === preset.value
                        ? 'bg-blue-500/20 border border-blue-500'
                        : 'bg-slate-800 border border-white/10 hover:bg-slate-700'
                    }`}
                    title={`${preset.label}: ${preset.value}%`}
                  >
                    <Icon className={`h-3 w-3 ${preset.color}`} />
                  </button>
                )
              })}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Risk Amount: <span className="text-white font-medium">${riskAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Position Info */}
      <div className="p-2 bg-slate-800/50 rounded space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Position Value</span>
          <span className="text-white font-medium">${(positionValue || 0).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Entry Price</span>
          <span className="text-white">${(effectiveEntryPrice || 0).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Quantity</span>
          <span className="text-white">{(quantity || 0).toFixed(6)}</span>
        </div>
      </div>

      {/* Stop Loss Analysis */}
      {stopLossPrice && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-400 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Stop Loss
            </span>
            <div className={`flex items-center gap-1 ${riskStatus.color}`}>
              <RiskIcon className="h-3 w-3" />
              <span className="text-xs font-medium">{riskStatus.label}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Price:</span>
              <span className="text-white ml-1">${(stopLossPrice || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-400">Distance:</span>
              <span className="text-red-400 ml-1">{stopLossPercentage.toFixed(2)}%</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400">Risk Amount:</span>
              <span className={`ml-1 font-medium ${
                stopLossDollarAmount > riskAmount ? 'text-red-400' : 'text-white'
              }`}>
                ${stopLossDollarAmount.toFixed(2)}
              </span>
              {stopLossDollarAmount > riskAmount && (
                <span className="text-red-400 text-xs ml-1">
                  (${(stopLossDollarAmount - riskAmount).toFixed(2)} over limit)
                </span>
              )}
            </div>
          </div>
          
          {/* Recommended Position Size */}
          {recommendedPositionSize > 0 && Math.abs(recommendedPositionSize - quantity) > 0.000001 && (
            <div className="pt-1.5 border-t border-white/10">
              <div className="text-xs text-gray-400">Recommended for ${riskAmount.toFixed(2)} risk:</div>
              <div className="text-xs text-green-400 font-medium">
                {recommendedPositionSize.toFixed(6)} units (${recommendedPositionValue.toFixed(2)})
              </div>
            </div>
          )}
        </div>
      )}

      {/* Take Profit Analysis */}
      {takeProfitCalculations.length > 0 && (
        <div className="space-y-1.5">
          {takeProfitCalculations.map((tp) => (
            <div key={tp.index} className="p-2 bg-green-500/10 border border-green-500/20 rounded space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Take Profit {tp.index}
                </span>
                {tp.rrRatio > 0 && (
                  <span className={`text-xs font-medium ${
                    tp.rrRatio >= 2 ? 'text-green-400' :
                    tp.rrRatio >= 1 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    R:R {tp.rrRatio.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white ml-1">${(tp.price || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Distance:</span>
                  <span className="text-green-400 ml-1">+{tp.percentage.toFixed(2)}%</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Profit Amount:</span>
                  <span className="text-green-400 font-medium ml-1">
                    ${tp.dollarAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overall Risk/Reward */}
      {overallRR > 0 && (
        <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Risk/Reward Ratio</span>
            <div className={`text-sm font-bold ${
              overallRR >= 2 ? 'text-green-400' :
              overallRR >= 1 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              1:{overallRR.toFixed(2)}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {overallRR >= 2 ? 'Excellent trade setup' :
             overallRR >= 1 ? 'Acceptable trade setup' : 'Poor risk/reward ratio'}
          </div>
        </div>
      )}

      {/* Warning if no stop loss */}
      {!stopLossPrice && (
        <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0" />
          <div className="text-xs text-orange-400">
            No stop loss set. Trading without a stop loss is extremely risky.
          </div>
        </div>
      )}
    </div>
  )
}

export default PositionCalculatorPanel