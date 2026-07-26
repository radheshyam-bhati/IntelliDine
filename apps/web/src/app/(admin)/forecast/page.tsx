'use client'

import { useState, useEffect } from 'react'
import type { Forecast, MenuItem, ForecastBasis } from '@kitchensync/shared'
import { get } from '@/lib/api'

export default function AdminForecastPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [forecastRes, menuRes] = await Promise.all([
          get<Forecast[]>(`/forecasts?date=${selectedDate}`),
          get<MenuItem[]>('/menu-items'),
        ])
        if (forecastRes.success && forecastRes.data)
          setForecasts(forecastRes.data)
        if (menuRes.success && menuRes.data) setMenuItems(menuRes.data)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedDate])

  const getItemName = (itemId: string) =>
    menuItems.find((i) => i.id === itemId)?.name || itemId.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Demand Forecast
        </h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      ) : forecasts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No forecast data for {selectedDate}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Data will appear once forecasts are generated
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {forecasts.map((fc) => (
            <div
              key={fc.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {getItemName(fc.menu_item_id)}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    fc.basis === 'restaurant_trained'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {fc.basis === 'restaurant_trained'
                    ? 'Trained Data'
                    : 'Cold Start Baseline'}
                </span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {fc.predicted_quantity}
                  </p>
                  <p className="text-xs text-gray-500">predicted units</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        fc.basis === 'restaurant_trained'
                          ? 'bg-ready'
                          : 'bg-warning'
                      }`}
                    />
                    <span className="text-xs text-gray-400">
                      {fc.basis === 'restaurant_trained'
                        ? 'High confidence'
                        : 'Lower confidence'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Generated {new Date(fc.generated_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {fc.basis === 'cold_start_baseline' && (
                <p className="text-xs text-amber-600 mt-2">
                  Based on industry averages. More accurate predictions
                  available once sufficient sales data is collected.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
