'use client'

import type { Order, OrderItem, OrderStatus } from '@kitchensync/shared'
import StatusBadge from './StatusBadge'
import { useState, useEffect } from 'react'

type OrderWithDetails = Order & {
  items?: (OrderItem & { name?: string })[]
  tableLabel?: string
}

interface OrderCardProps {
  order: OrderWithDetails
  variant: 'server' | 'kitchen'
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void
  onFlagLow?: (orderId: string) => void
  className?: string
}

const serverActions: OrderStatus[] = ['served']
const kitchenActions: { status: OrderStatus; label: string }[] = [
  { status: 'cooking', label: 'Start Cooking' },
  { status: 'ready', label: 'Mark Ready' },
]

function elapsedMinutes(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 60000)
}

export default function OrderCard({
  order,
  variant,
  onStatusChange,
  onFlagLow,
  className = '',
}: OrderCardProps) {
  const [minutes, setMinutes] = useState(elapsedMinutes(order.created_at))

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutes(elapsedMinutes(order.created_at))
    }, 60000)
    setMinutes(elapsedMinutes(order.created_at))
    return () => clearInterval(interval)
  }, [order.created_at])

  const urgencyColor =
    minutes > 20
      ? 'border-alert'
      : minutes > 10
        ? 'border-warning'
        : 'border-gray-200'

  if (variant === 'kitchen') {
    return (
      <div
        className={`kds-text rounded-lg border-2 ${urgencyColor} bg-gray-800 p-4 flex flex-col gap-3 ${className}`}
      >
        <div className="flex items-center justify-between">
          <span className="kds-text-lg font-bold">#{order.id.slice(0, 6)}</span>
          <StatusBadge status={order.status} />
        </div>

        <div className="text-sm text-gray-400">
          {minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`}
        </div>

        <div className="space-y-2">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <span className="font-medium">
                {item.quantity}x {item.name || 'Item'}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {kitchenActions
            .filter((a) => {
              const statusOrder: OrderStatus[] = [
                'placed',
                'received',
                'cooking',
                'ready',
                'served',
                'completed',
              ]
              return (
                statusOrder.indexOf(a.status) >
                statusOrder.indexOf(order.status)
              )
            })
            .map((action) => (
              <button
                key={action.status}
                onClick={() => onStatusChange?.(order.id, action.status)}
                className="min-touch rounded-md bg-white text-gray-900 px-6 py-3 font-bold hover:bg-gray-200 focus:outline-hidden focus:ring-2 focus:ring-white"
              >
                {action.label}
              </button>
            ))}
          {onFlagLow && (
            <button
              onClick={() => onFlagLow(order.id)}
              className="min-touch rounded-md border border-gray-500 text-gray-300 px-4 py-2 text-sm hover:bg-gray-700 focus:outline-hidden focus:ring-2 focus:ring-gray-400"
            >
              Flag Ingredient Low
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-lg border-2 ${urgencyColor} bg-white p-3 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900">
          Table {order.tableLabel || order.table_id.slice(0, 6)}
        </span>
        <StatusBadge status={order.status} />
      </div>

      <div className="text-xs text-gray-400 mb-2">
        {minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`}
      </div>

      <div className="space-y-1 mb-3">
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-700">
              {item.quantity}x {item.name || 'Item'}
            </span>
            <span className="text-gray-500">
              ${(item.unit_price_at_order * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {serverActions.includes(order.status) ? null : (
        <div className="flex gap-2">
          {order.status === 'ready' && (
            <button
              onClick={() => onStatusChange?.(order.id, 'served')}
              className="min-touch rounded-md bg-ready text-white px-4 py-2 text-sm font-semibold hover:opacity-90 focus:outline-hidden focus:ring-2 focus:ring-ready"
            >
              Mark Served
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => {}}
        className="min-touch text-sm text-gray-500 hover:text-gray-700 underline mt-1"
      >
        View Bill
      </button>
    </div>
  )
}
