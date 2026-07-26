'use client'

import { useState, useEffect, type FormEvent } from 'react'
import type { Ingredient } from '@kitchensync/shared'
import { get, post } from '@/lib/api'

export default function AdminInventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustments, setAdjustments] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await get<Ingredient[]>('/ingredients')
        if (res.success && res.data) setIngredients(res.data)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const handleAdjust = async (ingredientId: string) => {
    const change = adjustments[ingredientId]
    if (!change || change === 0) return
    setError(null)
    const res = await post('/inventory/adjust', {
      ingredientId,
      changeAmount: change,
      reason: 'manual_restock',
    })
    if (res.success) {
      setIngredients((prev) =>
        prev.map((ing) =>
          ing.id === ingredientId
            ? { ...ing, current_stock: ing.current_stock + change }
            : ing
        )
      )
      setAdjustments((prev) => ({ ...prev, [ingredientId]: 0 }))
      showSuccess('Stock adjusted')
    } else {
      setError(res.error || 'Failed to adjust stock')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Inventory Management
      </h1>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {ingredients.length === 0 ? (
        <p className="text-sm text-gray-400">No ingredients configured</p>
      ) : (
        <div className="space-y-2">
          {ingredients.map((ingredient) => {
            const isLow =
              ingredient.current_stock <= ingredient.reorder_threshold
            return (
              <div
                key={ingredient.id}
                className={`rounded-lg border bg-white p-4 ${
                  isLow ? 'border-alert/30 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {ingredient.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ingredient.current_stock} {ingredient.unit}
                    </p>
                  </div>
                  {isLow && (
                    <span className="inline-flex items-center rounded-full bg-alert/10 px-2 py-0.5 text-xs font-medium text-status-alert">
                      Low Stock
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isLow ? 'bg-alert' : 'bg-ready'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (ingredient.current_stock /
                          (ingredient.reorder_threshold * 3)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    value={adjustments[ingredient.id] || 0}
                    onChange={(e) =>
                      setAdjustments((prev) => ({
                        ...prev,
                        [ingredient.id]: Number(e.target.value),
                      }))
                    }
                    className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                    placeholder="Amount"
                  />
                  <button
                    onClick={() => handleAdjust(ingredient.id)}
                    disabled={!adjustments[ingredient.id]}
                    className="min-touch rounded-md bg-gray-900 text-white px-3 py-1 text-xs font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Adjust
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
