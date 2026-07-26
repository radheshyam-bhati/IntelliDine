'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Order, OrderItem, OrderStatus } from '@kitchensync/shared'
import { connect } from '@/lib/socket'

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'received', label: 'Received by Kitchen' },
  { key: 'cooking', label: 'Cooking' },
  { key: 'ready', label: 'Ready to Serve' },
  { key: 'served', label: 'Served' },
  { key: 'completed', label: 'Completed' },
]

const STATUS_INDEX: Record<OrderStatus, number> = {
  placed: 0,
  received: 1,
  cooking: 2,
  ready: 3,
  served: 4,
  completed: 5,
  cancelled: -1,
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order & { order_items: OrderItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchOrder() {
      try {
        setLoading(true)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/orders/${orderId}`
        )
        const data = await res.json()
        if (!cancelled) {
          if (data.success) setOrder(data.data)
          else setError(data.error || 'Order not found')
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load order')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchOrder()
    return () => { cancelled = true }
  }, [orderId])

  useEffect(() => {
    if (!order) return

    const socket = connect(order.restaurant_id, '', '')
    socket.on('order:updated', (updated: Order) => {
      if (updated.id === orderId) {
        setOrder((prev) => prev ? { ...prev, status: updated.status, updated_at: updated.updated_at } : prev)
      }
    })
    return () => { socket.disconnect() }
  }, [order, orderId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 text-lg animate-pulse">Loading order...</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">Unable to load order</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <Link href="/" className="mt-4 inline-block text-amber-700 underline text-sm">Back to home</Link>
        </div>
      </div>
    )
  }

  const currentIndex = STATUS_INDEX[order.status]
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl text-gray-900 mb-1">
          {isCancelled ? 'Order Cancelled' : 'Order Confirmed'}
        </h1>
        <p className="text-sm text-gray-500">
          Order #{orderId.slice(0, 8)}
        </p>
        <div className="mt-2 inline-block bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1 rounded-full">
          {order.status}
        </div>
      </div>

      {!isCancelled && (
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {STATUS_STEPS.map((step, i) => {
              const isActive = i <= (currentIndex ?? -1)
              const isCurrent = i === (currentIndex ?? -1)
              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
                  >
                    {i + 1}
                  </div>
                  <span className={`text-xs mt-1 text-center ${isActive ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <h2 className="font-medium text-gray-900 mb-3">Order Items</h2>
        <div className="space-y-2">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.quantity}x {item.menu_item_id.slice(0, 8)}
              </span>
              <span className="text-gray-900 font-medium">
                ${(item.unit_price_at_order * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm font-semibold text-gray-900">
          <span>Total</span>
          <span>${(order.order_items || []).reduce((s, i) => s + i.unit_price_at_order * i.quantity, 0).toFixed(2)}</span>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        This page updates in real time. Status last updated{' '}
        {new Date(order.updated_at).toLocaleTimeString()}
      </p>
    </div>
  )
}
