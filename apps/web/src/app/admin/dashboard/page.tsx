'use client'

import { useState, useEffect } from 'react'
import { get, post } from '@/lib/api'
import { KPICard } from '@/components/ui/KPICard'
import { CardSkeleton } from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'

interface DashboardData {
  ordersInProgress: number
  tablesOccupied: number
  todaysRevenue: number
  revenueTrend: { date: string; amount: number }[]
  bestSellers: { name: string; count: number }[]
  worstSellers: { name: string; count: number }[]
  avgOrderValue: number
  tableTurnover: number
  avgOrderToServeTime: number
  forecast: { itemName: string; predicted: number; basis: string; confidence: number }[]
  foodCostPercentage: number
  wasteCostToday: number
  profitMargin: number
  totalExpenses: number
  lowStockIngredients: { name: string; current_stock: number; threshold: number }[]
  totalStaff: number
  tablesTotal: number
  peakHour: string
  customerSatisfaction: number
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await get<DashboardData>(`/admin/dashboard?range=${timeRange}`)
        if (res.success && res.data) setData(res.data)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [timeRange])

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return
    setAiLoading(true)
    setAiResponse(null)
    const res = await post<{ answer: string; dataSource: string }>('/ai/query', {
      question: aiQuery,
    })
    if (res.success && res.data) {
      setAiResponse(res.data.answer)
    } else {
      setAiResponse(res.error || 'Failed to get response')
    }
    setAiLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <CardSkeleton count={6} />
      </div>
    )
  }

  if (!data) {
    return <EmptyState title="Failed to load dashboard data" />
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['today', 'week', 'month'] as const).map(range => (
            <button key={range}
              onClick={() => setTimeRange(range)}
              className={`min-touch px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeRange === range ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Core KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Today's Revenue" value={`$${data.todaysRevenue.toLocaleString()}`}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          trend={data.revenueTrend.length > 1 ? { value: 12, label: 'vs yesterday', direction: 'up' } : undefined} />
        <KPICard label="Orders" value={data.ordersInProgress} />
        <KPICard label="Tables" value={`${data.tablesOccupied}/${data.tablesTotal}`} />
        <KPICard label="Avg Order" value={`$${data.avgOrderValue.toFixed(2)}`} />
      </section>

      {/* Row 2: Financial KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Food Cost %</p>
          <p className={`text-2xl font-bold mt-1 ${data.foodCostPercentage > 35 ? 'text-red-600' : data.foodCostPercentage > 28 ? 'text-amber-600' : 'text-green-600'}`}>
            {data.foodCostPercentage.toFixed(1)}%
          </p>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${Math.min(data.foodCostPercentage * 2, 100)}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Profit Margin</p>
          <p className={`text-2xl font-bold mt-1 ${data.profitMargin > 20 ? 'text-green-600' : data.profitMargin > 10 ? 'text-amber-600' : 'text-red-600'}`}>
            {data.profitMargin.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Waste Today</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">${data.wasteCostToday.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Expenses</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">${data.totalExpenses.toLocaleString()}</p>
        </div>
      </section>

      {/* Row 3: Revenue Trend + Operations */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend</h2>
          {data.revenueTrend.length === 0 ? (
            <p className="text-xs text-gray-400">No data</p>
          ) : (
            <div className="space-y-1.5">
              {data.revenueTrend.map((point) => (
                <div key={point.date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 flex-shrink-0">{point.date}</span>
                  <div className="flex-1 h-6 bg-gray-50 rounded relative overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded transition-all duration-500"
                      style={{ width: `${Math.min((point.amount / Math.max(...data.revenueTrend.map(p => p.amount), 1)) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-900 w-20 text-right">${point.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Operations</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Table Turnover Rate</p>
              <p className="text-lg font-semibold text-gray-900">{data.tableTurnover.toFixed(1)} / day</p>
            </div>
            <div className="h-px bg-gray-100" />
            <div>
              <p className="text-xs text-gray-500">Avg Order-to-Serve Time</p>
              <p className="text-lg font-semibold text-gray-900">{data.avgOrderToServeTime} min</p>
            </div>
            <div className="h-px bg-gray-100" />
            <div>
              <p className="text-xs text-gray-500">Staff Count</p>
              <p className="text-lg font-semibold text-gray-900">{data.totalStaff}</p>
            </div>
            <div className="h-px bg-gray-100" />
            <div>
              <p className="text-xs text-gray-500">Peak Hour</p>
              <p className="text-lg font-semibold text-gray-900">{data.peakHour || 'N/A'}</p>
            </div>
            <div className="h-px bg-gray-100" />
            <div>
              <p className="text-xs text-gray-500">Satisfaction Score</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-900">{data.customerSatisfaction ? `${data.customerSatisfaction.toFixed(1)}/5` : 'N/A'}</p>
                {data.customerSatisfaction && (
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg key={star} className={`w-4 h-4 ${star <= Math.round(data.customerSatisfaction) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Row 4: Best/Worst Sellers + Forecast */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Best Sellers</h2>
          {data.bestSellers.length === 0 ? (
            <p className="text-xs text-gray-400">No data</p>
          ) : (
            <div className="space-y-2">
              {data.bestSellers.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                  <span className="text-xs text-gray-700 flex-1 truncate">{item.name}</span>
                  <span className="text-xs font-medium text-green-600">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Needs Improvement</h2>
          {data.worstSellers.length === 0 ? (
            <p className="text-xs text-gray-400">No data</p>
          ) : (
            <div className="space-y-2">
              {data.worstSellers.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                  <span className="text-xs text-gray-700 flex-1 truncate">{item.name}</span>
                  <span className="text-xs font-medium text-red-500">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Forecast Overview</h2>
          {data.forecast.length === 0 ? (
            <p className="text-xs text-gray-400">No forecast data</p>
          ) : (
            <div className="space-y-2">
              {data.forecast.map((item) => (
                <div key={item.itemName} className="text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span className="truncate">{item.itemName}</span>
                    <span className="font-medium ml-2">{item.predicted} units</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      item.basis === 'restaurant_trained' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.basis === 'restaurant_trained' ? 'Trained' : 'Cold Start'}
                    </span>
                    <span className="text-gray-400">{Math.round(item.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Row 5: Low Stock Alerts */}
      {data.lowStockIngredients && data.lowStockIngredients.length > 0 && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-sm font-semibold text-red-800">Low Stock Alerts ({data.lowStockIngredients.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {data.lowStockIngredients.map(ing => (
              <div key={ing.name} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-red-100">
                <span className="text-xs font-medium text-gray-700">{ing.name}</span>
                <span className="text-xs font-semibold text-red-600">{ing.current_stock} / {ing.threshold}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Assistant */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">AI Assistant</h2>
        <div className="flex gap-2">
          <input type="text" value={aiQuery} onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiQuery()}
            placeholder="Ask about sales, inventory, staff, or forecasts..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden transition-all" />
          <button onClick={handleAiQuery} disabled={aiLoading || !aiQuery.trim()}
            className="min-touch rounded-lg bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {aiLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : 'Ask'}
          </button>
        </div>
        {aiResponse && (
          <div className="mt-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 text-sm text-gray-700 leading-relaxed">
            {aiResponse}
          </div>
        )}
      </section>
    </div>
  )
}
