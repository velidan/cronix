import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export enum RiskLevel {
  CONSERVATIVE = 0.25,
  MODERATE = 0.5,
  AGGRESSIVE = 1.0,
  CUSTOM = -1
}

interface RiskManagementState {
  // User settings
  totalDeposit: number
  defaultRiskPercentage: number
  selectedRiskLevel: RiskLevel | number
  
  // Actions
  setTotalDeposit: (amount: number) => void
  setDefaultRiskPercentage: (percentage: number) => void
  setSelectedRiskLevel: (level: RiskLevel | number) => void
  
  // Calculations
  calculatePositionSize: (entryPrice: number, stopLossPrice: number, riskPercentage?: number) => number
  calculateRiskAmount: (riskPercentage?: number) => number
  calculateRiskRewardRatio: (entryPrice: number, stopLossPrice: number, takeProfitPrice: number) => number
}

export const useRiskManagementStore = create<RiskManagementState>()(
  persist(
    (set, get) => ({
      // Initial state
      totalDeposit: 1000,
      defaultRiskPercentage: 0.25,
      selectedRiskLevel: RiskLevel.CONSERVATIVE,

      // Actions
      setTotalDeposit: (amount: number) => {
        if (amount > 0) {
          set({ totalDeposit: amount })
        }
      },

      setDefaultRiskPercentage: (percentage: number) => {
        if (percentage > 0 && percentage <= 100) {
          set({ 
            defaultRiskPercentage: percentage,
            selectedRiskLevel: RiskLevel.CUSTOM
          })
        }
      },

      setSelectedRiskLevel: (level: RiskLevel | number) => {
        if (level === RiskLevel.CUSTOM) {
          set({ selectedRiskLevel: level })
        } else if (typeof level === 'number' && level > 0) {
          set({ 
            selectedRiskLevel: level,
            defaultRiskPercentage: level
          })
        }
      },

      // Calculations
      calculateRiskAmount: (riskPercentage?: number) => {
        const { totalDeposit, defaultRiskPercentage } = get()
        const riskPercent = riskPercentage ?? defaultRiskPercentage
        return (totalDeposit * riskPercent) / 100
      },

      calculatePositionSize: (entryPrice: number, stopLossPrice: number, riskPercentage?: number) => {
        const { calculateRiskAmount } = get()
        
        if (entryPrice <= 0 || stopLossPrice <= 0) return 0
        
        const riskAmount = calculateRiskAmount(riskPercentage)
        const stopLossDistance = Math.abs(entryPrice - stopLossPrice)
        
        if (stopLossDistance === 0) return 0
        
        // Position size = Risk amount / Stop loss distance per unit
        const positionSize = riskAmount / stopLossDistance
        
        return Math.max(0, positionSize)
      },

      calculateRiskRewardRatio: (entryPrice: number, stopLossPrice: number, takeProfitPrice: number) => {
        if (entryPrice <= 0 || stopLossPrice <= 0 || takeProfitPrice <= 0) return 0
        
        const risk = Math.abs(entryPrice - stopLossPrice)
        const reward = Math.abs(takeProfitPrice - entryPrice)
        
        if (risk === 0) return 0
        
        return reward / risk
      }
    }),
    {
      name: 'risk-management-storage',
      partialize: (state) => ({
        totalDeposit: state.totalDeposit,
        defaultRiskPercentage: state.defaultRiskPercentage,
        selectedRiskLevel: state.selectedRiskLevel
      })
    }
  )
)