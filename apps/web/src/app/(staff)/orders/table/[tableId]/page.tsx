'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Table, Order, OrderItem, MenuItem, OrderStatus } from '@kitchensync/shared'
import { get, post, patch } from '@/lib/api'
import OrderCard from '@/components/OrderCard'
import StatusBadge from '@/components/StatusBadge'

type OrderWithDetails = Order & {
  items?: (OrderItem & { name?: string })[]
  tableLabel?: string
}

export default function TableDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tableId = params.tableId as string

  const [table, setTable] = useState<Table | null>(null)
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [showAddItem, setShowAddItem] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [billAmount, setBillAmount] = useState<number | null>(null)
  const [billLoading, setBillLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [tableRes, ordersRes, menuRes] = await Promise.all([
          get<Table>(`/tables/${tableId}`),
          get<OrderWithDetails[]>(`/orders?tableId=${tableId}`),
          get<MenuItem[]>('/menu-items'),
        ])
        if (tableRes.success && tableRes.data) setTable(tableRes.data)
        if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data)
        if (menuRes.success && menuRes.data) setMenuItems(menuRes.data)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tableId])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setError(null)
    const res = await patch(`/orders/${orderId}`, { status: newStatus })
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
    } else {
      setError(res.error || 'Failed to update order')
    }
  }

  const handleAddItems = async () => {
    const itemsToAdd = Object.entries(selectedItems).filter(
      ([, qty]) => qty > 0
    )
    if (itemsToAdd.length === 0) return

    setError(null)
    const res = await post(`/orders`, {
      tableId,
      items: itemsToAdd.map(([menuItemId, quantity]) => ({
        menuItemId,
        quantity,
      })),
    })

    if (res.success) {
      setSelectedItems({})
      setShowAddItem(false)
      const ordersRes = await       get<OrderWithDetails[]>(
        `/orders?tableId=${tableId}`
      )
      if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data)
    } else {
      setError(res.error || 'Failed to add items')
    }
  }

  const handleGenerateBill = async () => {
    setBillLoading(true)
    setError(null)
    const res = await post<{ total: number }>('/bills', {
      tableId,
      orderIds: orders.map((o) => o.id),
    })
    if (res.success && res.data) {
      setBillAmount(res.data.total)
    } else {
      setError(res.error || 'Failed to generate bill')
    }
    setBillLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!table) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Table not found</p>
        <button
          onClick={() => router.push('/staff/orders')}
          className="text-sm text-blue-600 underline mt-2"
        >
          Back to orders
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Table {table.label}
          </h1>
          <p className="text-sm text-gray-500">
            Capacity: {table.capacity} &middot;{' '}
            {orders.length} active order{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => router.push('/staff/orders')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          No orders for this table
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              variant="server"
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowAddItem(!showAddItem)}
          className="min-touch rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800"
        >
          {showAddItem ? 'Cancel' : 'Add Items'}
        </button>
        <button
          onClick={handleGenerateBill}
          disabled={billLoading || orders.length === 0}
          className="min-touch rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {billLoading ? 'Generating...' : 'Generate Bill'}
        </button>
      </div>

      {billAmount !== null && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Bill Total</p>
          <p className="text-2xl font-bold text-gray-900">
            ${billAmount.toFixed(2)}
          </p>
        </div>
      )}

      {showAddItem && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <h3 className="font-medium text-gray-900 text-sm">Add Items</h3>
          {menuItems.length === 0 ? (
            <p className="text-xs text-gray-400">No menu items available</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() =>
                        setSelectedItems((prev) => ({
                          ...prev,
                          [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
                        }))
                      }
                      className="min-touch flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-sm"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium w-5 text-center">
                      {selectedItems[item.id] || 0}
                    </span>
                    <button
                      onClick={() =>
                        setSelectedItems((prev) => ({
                          ...prev,
                          [item.id]: (prev[item.id] || 0) + 1,
                        }))
                      }
                      className="min-touch flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleAddItems}
            disabled={
              Object.values(selectedItems).filter((q) => q > 0).length === 0
            }
            className="w-full rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Order
          </button>
        </div>
      )}

      <div className="pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Order History
        </h3>
        {orders.length === 0 ? (
          <p className="text-xs text-gray-400">No history</p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between text-xs text-gray-500"
              >
                <span>#{order.id.slice(0, 6)}</span>
                <StatusBadge status={order.status} />
                <span>
                  {new Date(order.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
