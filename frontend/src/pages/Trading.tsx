import { useEffect } from "react";
import { useTradingStore } from "../store/tradingStore";
import { useBracketOrderStore } from "../store/bracketOrderStore";
import { bracketOrdersApi } from "../services/bracketOrders";
import { generateDemoChartData, generatePriceUpdate } from "../utils/chartData";
import FinalTradingChart from "../components/FinalTradingChart";
import TradingToolbar from "../components/TradingToolbar";
import BracketOrderFormWithCalculator from "../components/BracketOrderFormWithCalculator";
import { useOrderTradingLines } from "../hooks/useOrderTradingLines";
import { Trash2 } from "lucide-react";
import { BracketOrder } from "../types/bracketOrder";

// OrderCard Component
const OrderCard = ({ order }: { order: BracketOrder }) => {
  const { removeOrder } = useBracketOrderStore();

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await bracketOrdersApi.cancel(orderId);
      removeOrder(orderId);
    } catch (error) {
      console.error("Failed to delete order:", error);
      alert("Failed to delete order. Please try again.");
    }
  };

  return (
    <div className="p-2 bg-slate-800/50 rounded border border-white/5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium ${
              order.side === "buy" ? "text-green-400" : "text-red-400"
            }`}
          >
            {order.side.toUpperCase()}
          </span>
          <span className="text-xs text-gray-400">{order.symbol}</span>
          <span className="text-xs text-gray-500">Qty: {order.quantity}</span>
        </div>
        <button
          onClick={() => handleDeleteOrder(order.id)}
          className="text-red-400 hover:text-red-300 p-0.5 rounded"
          title="Delete order"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-0.5 text-xs">
        {order.entry_price && (
          <div className="flex items-center justify-between text-gray-500">
            <span>Entry:</span>
            <span>${Number(order.entry_price).toFixed(2)}</span>
          </div>
        )}
        {order.stop_loss_price && (
          <div className="flex items-center justify-between text-gray-500">
            <span>SL:</span>
            <span>${Number(order.stop_loss_price).toFixed(2)}</span>
          </div>
        )}
        {order.take_profit_levels?.map((tp, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-gray-500"
          >
            <span>TP{index + 1}:</span>
            <span>${Number(tp.price).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Trading = () => {
  const {
    currentSymbol,
    currentTimeframe,
    chartData,
    setChartData,
    updateLastCandle,
    setLoading,
  } = useTradingStore();

  const { orders, setOrders, removeOrder } = useBracketOrderStore();

  // Sync orders with trading lines
  useOrderTradingLines();

  // Load orders on mount
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const orders = await bracketOrdersApi.getAll();
        setOrders(orders);
      } catch (error) {
        console.error("Failed to load orders:", error);
      }
    };
    loadOrders();
  }, [setOrders]);

  // Load chart data when symbol or timeframe changes
  useEffect(() => {
    setLoading(true);

    // Simulate API call delay
    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const data = generateDemoChartData(currentSymbol, currentTimeframe, 200);
      setChartData(data);
    };

    loadData();
  }, [currentSymbol, currentTimeframe, setChartData, setLoading]);

  // Simulate real-time price updates
  useEffect(() => {
    if (chartData.length === 0) return;

    const interval = setInterval(() => {
      const lastCandle = chartData[chartData.length - 1];
      if (lastCandle) {
        const updatedCandle = generatePriceUpdate(lastCandle, currentSymbol);
        updateLastCandle(updatedCandle);
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [chartData, currentSymbol, updateLastCandle]);

  return (
    <div className="space-y-4 flex flex-col flex-1">
      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4 flex-1">
        {/* Chart Section - Takes 2/3 of the width */}
        <div className="2xl:col-span-2 space-y-0">
          {/* Trading Toolbar */}
          <TradingToolbar />

          {/* Chart Widget */}
          <FinalTradingChart />
        </div>

        {/* Control Panel - Takes 1/3 of the width */}
        <div className="2xl:col-span-1 space-y-4">
          <BracketOrderFormWithCalculator />

          {/* Active Orders */}
          <div className="bg-slate-900/80 rounded-lg border border-white/10 p-3">
            <h4 className="text-sm font-semibold text-white mb-3">
              Active Orders
            </h4>
            {orders.length > 0 ? (
              <div className="space-y-2">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">
                No active orders
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trading;
