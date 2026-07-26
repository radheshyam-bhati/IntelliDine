'use client'

import { useState, useEffect } from 'react'
import { get, post } from '@/lib/api'
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
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await get<DashboardData>('/admin/dashboard')
        if (res.success && res.data) setData(res.data)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return
    setAiLoading(true)
    setAiResponse(null)
    const res = await post<{ response: string }>('/ai/query', {
      query: aiQuery,
    })
    if (res.success && res.data) {
      setAiResponse(res.data.response)
    } else {
      setAiResponse(res.error || 'Failed to get response')
    }
    setAiLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <CardSkeleton count={3} />
      </div>
    )
  }

  if (!data) {
    return <EmptyState title="Failed to load dashboard data" />
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Orders in Progress
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {data.ordersInProgress}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Tables Occupied
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {data.tablesOccupied}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Today&apos;s Revenue
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            ${data.todaysRevenue.toFixed(2)}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Revenue Trends
          </h2>
          {data.revenueTrend.length === 0 ? (
            <p className="text-xs text-gray-400">No data</p>
          ) : (
            <div className="space-y-1">
              {data.revenueTrend.map((point) => (
                <div
                  key={point.date}
                  className="flex justify-between text-xs text-gray-600"
                >
                  <span>{point.date}</span>
                  <span className="font-medium">
                    ${point.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Avg Order Value
          </h2>
          <p className="text-2xl font-bold text-gray-900">
            ${data.avgOrderValue.toFixed(2)}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Best Sellers
          </h2>
          {data.bestSellers.length === 0 ? (
            <p className="text-xs text-gray-400">No data</p>
          ) : (
            <div className="space-y-1">
              {data.bestSellers.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between text-xs text-gray-600"
                >
                  <span>{item.name}</span>
                  <span className="font-medium">{item.count} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Worst Sellers
          </h2>
          {data.worstSellers.length === 0 ? (
            <p className="text-xs text-gray-400">No data</p>
          ) : (
            <div className="space-y-1">
              {data.worstSellers.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between text-xs text-gray-600"
                >
                  <span>{item.name}</span>
                  <span className="font-medium">{item.count} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Operations
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Table Turnover Rate</p>
              <p className="text-lg font-semibold text-gray-900">
                {data.tableTurnover.toFixed(1)} / day
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">
                Avg Order-to-Serve Time
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {data.avgOrderToServeTime} min
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Forecast Overview
          </h2>
          {data.forecast.length === 0 ? (
            <p className="text-xs text-gray-400">No forecast data</p>
          ) : (
            <div className="space-y-2">
              {data.forecast.map((item) => (
                <div key={item.itemName} className="text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>{item.itemName}</span>
                    <span className="font-medium">
                      {item.predicted} units
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        item.basis === 'restaurant_trained'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.basis === 'restaurant_trained'
                        ? 'Trained'
                        : 'Cold Start'}
                    </span>
                    <span className="text-gray-400">
                      {Math.round(item.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          AI Assistant
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiQuery()}
            placeholder="Ask about operations, forecasting..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
          />
          <button
            onClick={handleAiQuery}
            disabled={aiLoading || !aiQuery.trim()}
            className="min-touch rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiLoading ? '...' : 'Ask'}
          </button>
        </div>
        {aiResponse && (
          <div className="mt-3 rounded-md bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700">
            {aiResponse}
          </div>
        )}
      </section>
    </div>
  )
}
