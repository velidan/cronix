import React, { useEffect, useState } from 'react'
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Percent,
  AlertTriangle,
  Shield,
  Zap,
  Flame,
  Settings
} from 'lucide-react'
import { useRiskManagementStore, RiskLevel } from '../store/riskManagementStore'
import { OrderSide } from '../types/bracketOrder'

interface PositionSizeCalculatorProps {
  entryPrice: number
  stopLossPrice?: number
  takeProfitPrice?: number
  side: OrderSide
  onPositionSizeCalculated?: (size: number) => void
  currentQuantity?: string
  onQuantityChange?: (quantity: string) => void
}

const PositionSizeCalculator: React.FC<PositionSizeCalculatorProps> = ({
  entryPrice,
  stopLossPrice,
  takeProfitPrice,
  side,
  onPositionSizeCalculated,
  currentQuantity,
  onQuantityChange
}) => {
  const {
    totalDeposit,
    defaultRiskPercentage,
    selectedRiskLevel,
    setTotalDeposit,
    setDefaultRiskPercentage,
    setSelectedRiskLevel,
    calculatePositionSize,
    calculateRiskAmount,
    calculateRiskRewardRatio
  } = useRiskManagementStore()

  const [showSettings, setShowSettings] = useState(false)
  const [tempDeposit, setTempDeposit] = useState(totalDeposit.toString())
  const [tempRiskPercent, setTempRiskPercent] = useState(defaultRiskPercentage.toString())
  const [calculatedSize, setCalculatedSize] = useState(0)
  const [manualOverride, setManualOverride] = useState(false)

  // Calculate position size when inputs change
  useEffect(() => {
    if (entryPrice > 0 && stopLossPrice && stopLossPrice > 0 && !manualOverride) {
      const size = calculatePositionSize(entryPrice, stopLossPrice)
      setCalculatedSize(size)
      
      if (onPositionSizeCalculated) {
        onPositionSizeCalculated(size)
      }
      
      if (onQuantityChange && !currentQuantity) {
        onQuantityChange(size.toFixed(6))
      }
    }
  }, [entryPrice, stopLossPrice, defaultRiskPercentage, totalDeposit, manualOverride])

  // Risk level presets
  const riskPresets = [
    { level: RiskLevel.CONSERVATIVE, label: 'Conservative', icon: Shield, color: 'text-green-400' },
    { level: RiskLevel.MODERATE, label: 'Moderate', icon: Zap, color: 'text-yellow-400' },
    { level: RiskLevel.AGGRESSIVE, label: 'Aggressive', icon: Flame, color: 'text-red-400' }
  ]

  const handleRiskLevelSelect = (level: RiskLevel) => {
    setSelectedRiskLevel(level)
    setDefaultRiskPercentage(level)
    setTempRiskPercent(level.toString())
    setManualOverride(false)
  }

  const handleCustomRiskChange = (value: string) => {
    setTempRiskPercent(value)
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
      setDefaultRiskPercentage(parsed)
      setManualOverride(false)
    }
  }

  const handleDepositChange = (value: string) => {
    setTempDeposit(value)
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && parsed > 0) {
      setTotalDeposit(parsed)
    }
  }

  const handleManualQuantityChange = (value: string) => {
    setManualOverride(true)
    if (onQuantityChange) {
      onQuantityChange(value)
    }
    
    // Calculate implied risk percentage
    const quantity = parseFloat(value)
    if (!isNaN(quantity) && quantity > 0 && entryPrice > 0 && stopLossPrice && stopLossPrice > 0) {
      const stopLossDistance = Math.abs(entryPrice - stopLossPrice)
      const riskAmount = quantity * stopLossDistance
      const impliedRiskPercent = (riskAmount / totalDeposit) * 100
      setTempRiskPercent(impliedRiskPercent.toFixed(3))
    }
  }

  // Calculate metrics
  const riskAmount = calculateRiskAmount()
  const stopLossPercent = stopLossPrice && entryPrice > 0 
    ? ((Math.abs(entryPrice - stopLossPrice) / entryPrice) * 100) 
    : 0
  const takeProfitPercent = takeProfitPrice && entryPrice > 0
    ? ((Math.abs(takeProfitPrice - entryPrice) / entryPrice) * 100)
    : 0
  const riskRewardRatio = stopLossPrice && takeProfitPrice && entryPrice > 0
    ? calculateRiskRewardRatio(entryPrice, stopLossPrice, takeProfitPrice)
    : 0
  
  const positionValue = calculatedSize * entryPrice
  const potentialProfit = takeProfitPrice && entryPrice > 0
    ? calculatedSize * Math.abs(takeProfitPrice - entryPrice)
    : 0
  const potentialLoss = stopLossPrice && entryPrice > 0
    ? calculatedSize * Math.abs(entryPrice - stopLossPrice)
    : 0

  return (
    <div className="bg-slate-900/80 rounded-lg border border-white/10 p-3 mt-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-400" />
          <h4 className="text-sm font-semibold text-white">Position Calculator</h4>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
        >
          <Settings className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-3 p-2 bg-slate-800/50 rounded border border-white/5">
          <div className="space-y-2">
            {/* Deposit Amount */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Account Balance</label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
                <input
                  type="number"
                  value={tempDeposit}
                  onChange={(e) => handleDepositChange(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-white/10 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Risk Presets */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Risk Level</label>
              <div className="grid grid-cols-3 gap-1">
                {riskPresets.map(({ level, label, icon: Icon, color }) => (
                  <button
                    key={level}
                    onClick={() => handleRiskLevelSelect(level)}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                      selectedRiskLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-3 w-3 ${selectedRiskLevel === level ? 'text-white' : color}`} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Risk Percentage */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Risk Per Trade (%)</label>
              <div className="relative">
                <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
                <input
                  type="number"
                  step="0.01"
                  value={tempRiskPercent}
                  onChange={(e) => handleCustomRiskChange(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-white/10 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculated Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Risk Amount */}
        <div className="bg-slate-800/50 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            <span className="text-xs text-gray-400">Risk Amount</span>
          </div>
          <p className="text-sm font-mono text-red-400">
            ${riskAmount.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {defaultRiskPercentage.toFixed(2)}% of ${totalDeposit.toFixed(0)}
          </p>
        </div>

        {/* Risk/Reward Ratio */}
        <div className="bg-slate-800/50 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            {side === OrderSide.BUY ? (
              <TrendingUp className="h-3 w-3 text-green-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-400" />
            )}
            <span className="text-xs text-gray-400">Risk/Reward</span>
          </div>
          <p className={`text-sm font-mono ${riskRewardRatio >= 2 ? 'text-green-400' : riskRewardRatio >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
            1:{riskRewardRatio.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {takeProfitPercent.toFixed(1)}% / {stopLossPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Position Size */}
      <div className="bg-slate-800/50 rounded p-2 mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Calculated Position Size</span>
          <span className="text-xs text-gray-500">
            Max value: ${positionValue.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.000001"
            value={manualOverride ? currentQuantity : calculatedSize.toFixed(6)}
            onChange={(e) => handleManualQuantityChange(e.target.value)}
            placeholder="0.001"
            className="flex-1 px-2 py-1.5 bg-slate-900 border border-white/10 rounded text-white text-sm font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {manualOverride && (
            <button
              onClick={() => {
                setManualOverride(false)
                if (onQuantityChange) {
                  onQuantityChange(calculatedSize.toFixed(6))
                }
              }}
              className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
            >
              Reset
            </button>
          )}
        </div>
        {manualOverride && (
          <p className="text-xs text-yellow-400 mt-1">
            Manual override - Risk: {tempRiskPercent}%
          </p>
        )}
      </div>

      {/* Profit/Loss Preview */}
      {(potentialProfit > 0 || potentialLoss > 0) && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Potential Profit:</span>
            <span className="text-green-400 font-mono">+${potentialProfit.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Potential Loss:</span>
            <span className="text-red-400 font-mono">-${potentialLoss.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PositionSizeCalculator