import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  OrderSide, 
  EntryType, 
  BracketOrderCreate, 
  BracketOrderFormData,
  TakeProfitLevel 
} from '../types/bracketOrder'
import { bracketOrdersApi } from '../services/bracketOrders'
import { useTradingStore } from '../store/tradingStore'
import { useBracketOrderStore } from '../store/bracketOrderStore'
import PositionSizeCalculator from './PositionSizeCalculator'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  AlertTriangle,
  Plus,
  Activity,
  Calculator
} from 'lucide-react'

const bracketOrderSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.nativeEnum(OrderSide),
  quantity: z.string().min(1, 'Quantity is required'),
  entry_type: z.nativeEnum(EntryType),
  entry_price: z.string().optional(),
  stop_loss_price: z.string().optional(),
  take_profit_1_price: z.string().optional(),
  take_profit_1_quantity: z.string().optional(),
  take_profit_2_price: z.string().optional(),
  take_profit_2_quantity: z.string().optional(),
})

const BracketOrderForm = () => {
  const { currentSymbol, chartData } = useTradingStore()
  const { addOrder } = useBracketOrderStore()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [orderAmount, setOrderAmount] = useState('')
  const queryClient = useQueryClient()
  
  // Get current price from the latest candle
  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<BracketOrderFormData>({
    resolver: zodResolver(bracketOrderSchema),
    defaultValues: {
      symbol: currentSymbol,
      side: OrderSide.BUY,
      entry_type: EntryType.LIMIT,
      quantity: '',
      entry_price: '',
      stop_loss_price: '',
      take_profit_1_price: '',
      take_profit_1_quantity: '',
      take_profit_2_price: '',
      take_profit_2_quantity: '',
    },
  })

  const watchedValues = watch()

  // Update symbol when trading store changes
  useEffect(() => {
    setValue('symbol', currentSymbol)
  }, [currentSymbol, setValue])

  // Calculate quantity from order amount
  useEffect(() => {
    if (orderAmount) {
      const amount = parseFloat(orderAmount)
      if (!isNaN(amount) && amount > 0) {
        const entryPrice = watchedValues.entry_type === EntryType.LIMIT && watchedValues.entry_price
          ? parseFloat(watchedValues.entry_price)
          : currentPrice
        
        if (entryPrice > 0) {
          const quantity = amount / entryPrice
          setValue('quantity', quantity.toFixed(6))
        }
      }
    }
  }, [orderAmount, currentPrice, watchedValues.entry_price, watchedValues.entry_type, setValue])

  // Calculate order amount from quantity
  useEffect(() => {
    if (watchedValues.quantity) {
      const quantity = parseFloat(watchedValues.quantity)
      if (!isNaN(quantity) && quantity > 0) {
        const entryPrice = watchedValues.entry_type === EntryType.LIMIT && watchedValues.entry_price
          ? parseFloat(watchedValues.entry_price)
          : currentPrice
        
        if (entryPrice > 0) {
          const amount = quantity * entryPrice
          // Don't update if user is typing in order amount field
          if (document.activeElement?.id !== 'order-amount-input') {
            setOrderAmount(amount.toFixed(2))
          }
        }
      } else {
        // Clear order amount if quantity is cleared
        if (document.activeElement?.id !== 'order-amount-input') {
          setOrderAmount('')
        }
      }
    }
  }, [watchedValues.quantity, watchedValues.entry_price, watchedValues.entry_type, currentPrice])

  // Create bracket order mutation
  const createOrderMutation = useMutation({
    mutationFn: bracketOrdersApi.create,
    onSuccess: (data) => {
      console.log('Bracket order created:', data)
      queryClient.invalidateQueries({ queryKey: ['bracket-orders'] })
      
      // Add to bracket order store
      addOrder(data)
      
      // Reset form
      reset({
        symbol: currentSymbol,
        side: OrderSide.BUY,
        entry_type: EntryType.LIMIT,
        quantity: '',
        entry_price: '',
        stop_loss_price: '',
        take_profit_1_price: '',
        take_profit_1_quantity: '',
        take_profit_2_price: '',
        take_profit_2_quantity: '',
      })
    },
    onError: (error: any) => {
      console.error('Failed to create bracket order:', error)
    },
  })


  const onSubmit = (data: BracketOrderFormData) => {
    console.log('Form data:', data)
    
    // Build take profit levels
    const takeProfitLevels: TakeProfitLevel[] = []
    
    if (data.take_profit_1_price && data.take_profit_1_quantity) {
      takeProfitLevels.push({
        price: parseFloat(data.take_profit_1_price),
        quantity: parseFloat(data.take_profit_1_quantity),
      })
    }
    
    if (data.take_profit_2_price && data.take_profit_2_quantity) {
      takeProfitLevels.push({
        price: parseFloat(data.take_profit_2_price),
        quantity: parseFloat(data.take_profit_2_quantity),
      })
    }

    // Build the order
    const order: BracketOrderCreate = {
      symbol: data.symbol,
      side: data.side,
      quantity: parseFloat(data.quantity),
      entry_type: data.entry_type,
      entry_price: data.entry_price ? parseFloat(data.entry_price) : undefined,
      stop_loss_price: data.stop_loss_price ? parseFloat(data.stop_loss_price) : undefined,
      take_profit_levels: takeProfitLevels,
    }

    createOrderMutation.mutate(order)
  }

  return (
    <div className="bg-slate-900/80 rounded-lg border border-white/10 p-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white">Bracket Order</h4>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowCalculator(!showCalculator)}
            className={`text-xs transition-colors ${
              showCalculator ? 'text-blue-300' : 'text-blue-400 hover:text-blue-300'
            }`}
          >
            <Calculator className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {showAdvanced ? 'Simple' : 'Advanced'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Order Type Toggle */}
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setValue('side', OrderSide.BUY)}
            className={`px-3 py-1.5 rounded font-medium text-xs transition-colors ${
              watchedValues.side === OrderSide.BUY
                ? 'bg-green-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="h-3 w-3 inline mr-1" />
            BUY
          </button>
          <button
            type="button"
            onClick={() => setValue('side', OrderSide.SELL)}
            className={`px-3 py-1.5 rounded font-medium text-xs transition-colors ${
              watchedValues.side === OrderSide.SELL
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            <TrendingDown className="h-3 w-3 inline mr-1" />
            SELL
          </button>
        </div>

        {/* Entry Type Toggle */}
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setValue('entry_type', EntryType.MARKET)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              watchedValues.entry_type === EntryType.MARKET
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            Market
          </button>
          <button
            type="button"
            onClick={() => setValue('entry_type', EntryType.LIMIT)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              watchedValues.entry_type === EntryType.LIMIT
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            Limit
          </button>
        </div>

        {/* Order Amount Field */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Order Amount
          </label>
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
            <input
              id="order-amount-input"
              type="number"
              step="0.01"
              value={orderAmount}
              onChange={(e) => {
                setOrderAmount(e.target.value)
                // Clear quantity to trigger recalculation
                if (e.target.value === '') {
                  setValue('quantity', '')
                }
              }}
              onBlur={() => {
                // Recalculate quantity when user finishes typing
                if (orderAmount) {
                  const amount = parseFloat(orderAmount)
                  if (!isNaN(amount) && amount > 0) {
                    const entryPrice = watchedValues.entry_type === EntryType.LIMIT && watchedValues.entry_price
                      ? parseFloat(watchedValues.entry_price)
                      : currentPrice
                    
                    if (entryPrice > 0) {
                      const quantity = amount / entryPrice
                      setValue('quantity', quantity.toFixed(6))
                    }
                  }
                }
              }}
              placeholder="100.00"
              className="w-full pl-7 pr-2 py-1.5 bg-slate-800 border border-white/10 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Amount of money to invest in this order
          </p>
        </div>

        {/* Quantity Field */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Quantity
          </label>
          <input
            {...register('quantity')}
            type="number"
            step="0.000001"
            placeholder="0.001"
            onBlur={(e) => {
              // Update order amount when quantity changes
              const quantity = parseFloat(e.target.value)
              if (!isNaN(quantity) && quantity > 0) {
                const entryPrice = watchedValues.entry_type === EntryType.LIMIT && watchedValues.entry_price
                  ? parseFloat(watchedValues.entry_price)
                  : currentPrice
                
                if (entryPrice > 0) {
                  const amount = quantity * entryPrice
                  setOrderAmount(amount.toFixed(2))
                }
              } else if (e.target.value === '') {
                setOrderAmount('')
              }
            }}
            className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.quantity && (
            <p className="text-red-400 text-xs mt-0.5">{errors.quantity.message}</p>
          )}
          {watchedValues.quantity && currentPrice > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              ≈ ${(parseFloat(watchedValues.quantity) * (watchedValues.entry_type === EntryType.LIMIT && watchedValues.entry_price ? parseFloat(watchedValues.entry_price) : currentPrice)).toFixed(2)} value
            </p>
          )}
        </div>
        
        {/* Position Size Calculator */}
        {showCalculator && (
          <PositionSizeCalculator
            entryPrice={
              watchedValues.entry_type === EntryType.LIMIT 
                ? parseFloat(watchedValues.entry_price || '0') || currentPrice
                : currentPrice
            }
            stopLossPrice={parseFloat(watchedValues.stop_loss_price || '0') || undefined}
            takeProfitPrice={parseFloat(watchedValues.take_profit_1_price || '0') || undefined}
            side={watchedValues.side}
            currentQuantity={watchedValues.quantity}
            onQuantityChange={(quantity) => {
              setValue('quantity', quantity)
              setOrderAmount('')  // Clear order amount when calculator sets quantity
            }}
          />
        )}

        {/* Entry Price (only for limit orders) */}
        {watchedValues.entry_type === EntryType.LIMIT && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Entry Price
            </label>
            <div className="relative">
              <input
                {...register('entry_price')}
                type="number"
                step="0.01"
                placeholder="45000.00"
                className="w-full px-2 py-1.5 pr-8 bg-slate-800 border border-white/10 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setValue('entry_price', currentPrice.toFixed(2))}
                title="Use current market price"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Activity className="h-3 w-3" />
              </button>
            </div>
            {errors.entry_price && (
              <p className="text-red-400 text-xs mt-0.5">{errors.entry_price.message}</p>
            )}
          </div>
        )}

        {/* Stop Loss */}
        <div>
          <label className="flex items-center text-xs font-medium text-gray-300 mb-1">
            <AlertTriangle className="h-3 w-3 mr-1 text-red-400" />
            Stop Loss Price (Optional)
          </label>
          <input
            {...register('stop_loss_price')}
            type="number"
            step="0.01"
            placeholder="40000.00"
            className="w-full px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Take Profit 1 */}
        <div>
          <label className="flex items-center text-xs font-medium text-gray-300 mb-1">
            <Target className="h-3 w-3 mr-1 text-green-400" />
            Take Profit 1 (Optional)
          </label>
          <div className="grid grid-cols-2 gap-1">
            <input
              {...register('take_profit_1_price')}
              type="number"
              step="0.01"
              placeholder="Price"
              className="px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              {...register('take_profit_1_quantity')}
              type="number"
              step="0.000001"
              placeholder="Quantity"
              className="px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Take Profit 2 (Advanced) */}
        {showAdvanced && (
          <div>
            <label className="flex items-center text-xs font-medium text-gray-300 mb-1">
              <DollarSign className="h-3 w-3 mr-1 text-cyan-400" />
              Take Profit 2 (Optional)
            </label>
            <div className="grid grid-cols-2 gap-1">
              <input
                {...register('take_profit_2_price')}
                type="number"
                step="0.01"
                placeholder="Price"
                className="px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                {...register('take_profit_2_quantity')}
                type="number"
                step="0.000001"
                placeholder="Quantity"
                className="px-2 py-1.5 bg-slate-800 border border-white/10 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={createOrderMutation.isPending}
          className={`w-full px-3 py-2 rounded font-medium text-xs transition-colors flex items-center justify-center ${
            watchedValues.side === OrderSide.BUY
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          } disabled:opacity-50`}
        >
          <Plus className="h-3 w-3 mr-1" />
          {createOrderMutation.isPending
            ? 'Creating Order...'
            : `Place ${watchedValues.side?.toUpperCase()} Order`}
        </button>

        {/* Error Display */}
        {createOrderMutation.error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-2 py-1.5 rounded text-xs">
            {(createOrderMutation.error as any)?.response?.data?.detail || 
             'Failed to create bracket order'}
          </div>
        )}
      </form>
    </div>
  )
}

export default BracketOrderForm