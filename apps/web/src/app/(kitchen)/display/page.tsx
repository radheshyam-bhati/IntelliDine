'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Order, OrderItem, OrderStatus, Ingredient } from '@kitchensync/shared'
import { get, patch, post } from '@/lib/api'
import { connect } from '@/lib/socket'
import { supabase } from '@/lib/supabase-client'
import StatusBadge from '@/components/StatusBadge'

type OrderWithDetails = Order & {
  items?: (OrderItem & { name?: string })[]
  tableLabel?: string
}

function elapsedMinutes(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
}

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [flagModal, setFlagModal] = useState<{ orderId: string; open: boolean }>({ orderId: '', open: false })
  const [selectedIngredient, setSelectedIngredient] = useState('')
  const [flagMsg, setFlagMsg] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let socket: ReturnType<typeof connect> | null = null
    controller.signal.addEventListener('abort', () => {
      if (socket) socket.disconnect()
    })

    async function init() {
      try {
        setLoading(true)
        const [ordersRes, ingredientsRes] = await Promise.all([
          get<OrderWithDetails[]>('/orders/active'),
          get<Ingredient[]>('/ingredients'),
        ])
        if (ordersRes.success && ordersRes.data) {
          setOrders(ordersRes.data)
        }
        if (ingredientsRes.success && ingredientsRes.data) {
          setIngredients(ingredientsRes.data)
        }
      } finally {
        setLoading(false)
      }

      if (controller.signal.aborted) return

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token || ''

      socket = connect('', token)

      socket.on('order:created', (order) => {
        setOrders((prev) => [...prev, order])
      })

      socket.on('order:updated', (updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
          )
        )
      })
    }

    init()

    return () => {
      controller.abort()
    }
  }, [])

  const handleStatusChange = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      const res = await patch(`/orders/${orderId}`, { status: newStatus })
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        )
      }
    },
    []
  )

  const handleFlagLow = useCallback(async () => {
    if (!selectedIngredient) return
    setFlagMsg('')
    const res = await post('/inventory/flag-low', { ingredientId: selectedIngredient })
    if (res.success) {
      setFlagMsg(`Flagged low successfully`)
    } else {
      setFlagMsg(res.error || 'Failed to flag ingredient')
    }
    setTimeout(() => {
      setFlagModal({ orderId: '', open: false })
      setFlagMsg('')
      setSelectedIngredient('')
    }, 2000)
  }, [selectedIngredient])

  const sorted = [...orders].sort((a, b) => {
    const aMin = elapsedMinutes(a.created_at)
    const bMin = elapsedMinutes(b.created_at)
    return bMin - aMin
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="kds-text animate-pulse text-gray-400">Loading orders...</div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="kds-text-xl text-gray-500 mb-2">No Active Orders</div>
          <div className="text-gray-600">New orders will appear here</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-2rem)] items-start">
      {sorted.map((order) => {
        const mins = elapsedMinutes(order.created_at)
        const urgency =
          mins > 20 ? 'border-alert' : mins > 10 ? 'border-warning' : 'border-transparent'

        return (
          <div
            key={order.id}
            className={`flex-shrink-0 w-72 rounded-lg border-2 ${urgency} bg-gray-800 p-4 flex flex-col gap-3`}
          >
            <div className="flex items-center justify-between">
              <span className="kds-text-lg font-bold">
                #{order.id.slice(0, 6)}
              </span>
              <StatusBadge status={order.status} />
            </div>

            <div className="text-sm text-gray-400">
              {mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`}
            </div>

            <div className="text-xs text-gray-500">
                Table {order.tableLabel || order.table_id.slice(0, 6)}
            </div>

            <div className="flex-1 space-y-2">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between kds-text">
                  <span className="font-medium">
                    {item.quantity}x {item.name || 'Item'}
                  </span>
                </div>
              )) || (
                <div className="text-gray-500 text-sm">No items</div>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-2">
              {order.status === 'received' && (
                <button
                  onClick={() => handleStatusChange(order.id, 'cooking')}
                  className="min-touch rounded-md bg-warning text-white px-4 py-3 kds-text font-bold hover:opacity-90 focus:outline-hidden focus:ring-2 focus:ring-warning"
                >
                  Start Cooking
                </button>
              )}
              {order.status === 'cooking' && (
                <button
                  onClick={() => handleStatusChange(order.id, 'ready')}
                  className="min-touch rounded-md bg-ready text-white px-4 py-3 kds-text font-bold hover:opacity-90 focus:outline-hidden focus:ring-2 focus:ring-ready"
                >
                  Mark Ready
                </button>
              )}
              {order.status === 'placed' && (
                <button
                  onClick={() => handleStatusChange(order.id, 'received')}
                  className="min-touch rounded-md bg-blue-500 text-white px-4 py-3 kds-text font-bold hover:opacity-90 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                >
                  Accept Order
                </button>
              )}
              <button
                onClick={() => setFlagModal({ orderId: order.id, open: true })}
                className="min-touch rounded-md border border-gray-500 text-gray-300 px-3 py-2 text-sm hover:bg-gray-700 focus:outline-hidden focus:ring-2 focus:ring-gray-400"
              >
                Flag Ingredient Low
              </button>
            </div>
          </div>
        )
      })}

      {flagModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-white font-bold mb-3">Flag Ingredient Low</h3>
            {flagMsg ? (
              <p className="text-sm text-gray-300">{flagMsg}</p>
            ) : (
              <>
                <select
                  value={selectedIngredient}
                  onChange={(e) => setSelectedIngredient(e.target.value)}
                  className="w-full rounded-md bg-gray-700 text-white px-3 py-2 text-sm border border-gray-600 mb-4"
                >
                  <option value="">Select ingredient...</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.current_stock} {ing.unit})
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFlagModal({ orderId: '', open: false })}
                    className="flex-1 rounded-md border border-gray-500 text-gray-300 px-3 py-2 text-sm hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFlagLow}
                    disabled={!selectedIngredient}
                    className="flex-1 rounded-md bg-alert text-white px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    Flag Low
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
