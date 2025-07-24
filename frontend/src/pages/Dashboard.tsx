import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'

const Dashboard = () => {
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.get('/trading/portfolio').then(res => res.data),
  })

  const { data: balance } = useQuery({
    queryKey: ['balance'],
    queryFn: () => api.get('/trading/balance').then(res => res.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const totalValue = portfolio?.total_value_usd || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your trading activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="trading-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Value</p>
              <p className="text-2xl font-semibold text-foreground">
                ${totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="trading-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">24h Change</p>
              <p className="text-2xl font-semibold trading-green">+5.2%</p>
            </div>
          </div>
        </div>

        <div className="trading-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
              <p className="text-2xl font-semibold text-foreground">3</p>
            </div>
          </div>
        </div>

        <div className="trading-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-8 w-8 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">P&L Today</p>
              <p className="text-2xl font-semibold trading-green">+$245</p>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="trading-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Portfolio Balance</h3>
          <div className="space-y-3">
            {portfolio?.balances?.map((bal: any) => (
              <div key={bal.currency} className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {bal.currency.charAt(0)}
                    </span>
                  </div>
                  <span className="font-medium text-foreground">{bal.currency}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{bal.available}</p>
                  <p className="text-sm text-muted-foreground">Available</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="trading-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <div>
                <p className="font-medium text-foreground">BTC Buy Order</p>
                <p className="text-sm text-muted-foreground">0.1 BTC @ $50,000</p>
              </div>
              <span className="text-sm trading-green">Filled</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <div>
                <p className="font-medium text-foreground">ETH Sell Order</p>
                <p className="text-sm text-muted-foreground">2.0 ETH @ $3,200</p>
              </div>
              <span className="text-sm text-yellow-400">Pending</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium text-foreground">USDT Deposit</p>
                <p className="text-sm text-muted-foreground">1,000 USDT</p>
              </div>
              <span className="text-sm trading-green">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard