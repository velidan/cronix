import { useEffect } from 'react'
import { useTradingStore } from '../store/tradingStore'
import { useBracketOrderStore } from '../store/bracketOrderStore'
import { bracketOrdersApi } from '../services/bracketOrders'
import { generateDemoChartData, generatePriceUpdate } from '../utils/chartData'
import FinalTradingChart from '../components/FinalTradingChart'
import TradingControls from '../components/TradingControls'
import BracketOrderForm from '../components/BracketOrderForm'
import { useOrderTradingLines } from '../hooks/useOrderTradingLines'

const Trading = () => {
  const { 
    currentSymbol, 
    currentTimeframe, 
    chartData,
    setChartData, 
    updateLastCandle,
    setLoading 
  } = useTradingStore()

  const { setOrders } = useBracketOrderStore()

  // Sync orders with trading lines
  useOrderTradingLines()

  // Load orders on mount
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const orders = await bracketOrdersApi.getAll()
        setOrders(orders)
      } catch (error) {
        console.error('Failed to load orders:', error)
      }
    }
    loadOrders()
  }, [setOrders])

  // Load chart data when symbol or timeframe changes
  useEffect(() => {
    setLoading(true)
    
    // Simulate API call delay
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const data = generateDemoChartData(currentSymbol, currentTimeframe, 200)
      setChartData(data)
    }
    
    loadData()
  }, [currentSymbol, currentTimeframe, setChartData, setLoading])

  // Simulate real-time price updates
  useEffect(() => {
    if (chartData.length === 0) return

    const interval = setInterval(() => {
      const lastCandle = chartData[chartData.length - 1]
      if (lastCandle) {
        const updatedCandle = generatePriceUpdate(lastCandle, currentSymbol)
        updateLastCandle(updatedCandle)
      }
    }, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [chartData, currentSymbol, updateLastCandle])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trading Terminal</h1>
        <p className="text-muted-foreground">Advanced charting with trading lines</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Chart - Takes 3/4 of the width */}
        <div className="xl:col-span-3">
          <FinalTradingChart />
        </div>
        
        {/* Controls - Takes 1/4 of the width */}
        <div className="xl:col-span-1 space-y-6">
          <BracketOrderForm />
          <TradingControls />
        </div>
      </div>
    </div>
  )
}

export default Trading