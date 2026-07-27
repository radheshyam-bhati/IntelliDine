'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Order, OrderItem } from '@kitchensync/shared'

type OrderWithItems = Order & { order_items: OrderItem[] }

export default function OrderHistoryPage() {
  const params = useParams()
  const slug = params.slug as string
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchOrders() {
      try {
        setLoading(true)
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
        const res = await fetch(`${api}/orders/my-orders?slug=${slug}`)
        const data = await res.json()
        if (!cancelled) {
          if (data.success) setOrders(data.data || [])
          else setError(data.error || 'Failed to load orders')
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Network error')
      } finally { if (!cancelled) setLoading(false) }
    }
    fetchOrders()
    return () => { cancelled = true }
  }, [slug])

  const statusColors: Record<string, string> = {
    placed: 'bg-gray-100 text-gray-700',
    received: 'bg-blue-100 text-blue-700',
    cooking: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-green-100 text-green-700',
    served: 'bg-green-200 text-green-800',
    completed: 'bg-green-300 text-green-900',
    cancelled: 'bg-red-100 text-red-700',
  }

  const getTotal = (order: OrderWithItems) => order.order_items?.reduce((s, i) => s + i.unit_price_at_order * i.quantity, 0) || 0

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-gray-400 animate-pulse">Loading orders...</div></div>
  if (error) return <div className="text-center py-12"><p className="text-red-500">{error}</p></div>

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Your order history</p>
        </div>
        <Link href={`/menu/${slug}`} className="text-sm text-amber-700 underline hover:text-amber-800">
          Back to Menu
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-500">No orders yet</p>
          <Link href={`/menu/${slug}`} className="mt-3 inline-block rounded-md bg-amber-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-amber-700">
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const total = getTotal(order)
            const isExpanded = expandedOrder === order.id
            return (
              <div key={order.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors focus:outline-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-sm font-bold text-gray-900">${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs text-gray-400">
                      {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                    </p>
                    {(order.status === 'completed' || order.status === 'served') && (
                      <span className="text-xs text-green-600 font-medium">✓ Delivered</span>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-2">
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{item.quantity}x <span className="font-medium">{item.menu_item_id.slice(0, 8)}</span></span>
                        <span className="text-gray-900 font-medium">${(item.unit_price_at_order * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <Link href={`/menu/${slug}/order/${order.id}`}
                      className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-medium mt-1">
                      View Details →
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
