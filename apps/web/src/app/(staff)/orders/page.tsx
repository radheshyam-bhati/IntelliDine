'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Table, Order, OrderItem, OrderStatus } from '@kitchensync/shared'
import { get, patch } from '@/lib/api'
import { connect } from '@/lib/socket'
import { supabase } from '@/lib/supabase-client'
import TableCard from '@/components/TableCard'
import OrderCard from '@/components/OrderCard'

type OrderWithDetails = Order & {
  items?: (OrderItem & { name?: string })[]
  tableLabel?: string
}

export default function StaffOrdersPage() {
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>([])
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [notifications, setNotifications] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token || ''
      const restaurantId = ''

      const socket = connect(restaurantId, token)

      socket.on('order:created', (order) => {
        setOrders((prev) => [...prev, order])
        if (order.status === 'ready') {
          setNotifications((prev) => [
            ...prev,
            `Order ready for table ${(order as OrderWithDetails).tableLabel || order.table_id.slice(0, 6)}`,
          ])
          setTimeout(() => {
            setNotifications((prev) => prev.slice(1))
          }, 8000)
        }
      })

      socket.on('order:updated', (updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
          )
        )
      })

      socket.on('table:updated', (updatedTable) => {
        setTables((prev) =>
          prev.map((t) =>
            t.id === updatedTable.id ? updatedTable : t
          )
        )
      })

      return () => {
        socket.disconnect()
      }
    }

    init()
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const tablesRes = await get<Table[]>('/tables')
        if (tablesRes.success && tablesRes.data) {
          setTables(tablesRes.data)
        }
        const ordersRes = await get<OrderWithDetails[]>('/orders/active')
        if (ordersRes.success && ordersRes.data) {
          setOrders(ordersRes.data)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const activeOrdersForTable = useCallback(
    (tableId: string) => orders.filter((o) => o.table_id === tableId),
    [orders]
  )

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const res = await patch(`/orders/${orderId}`, { status: newStatus })
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
    }
  }

  const dismissNotification = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index))
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
      {notifications.map((msg, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg bg-ready text-white px-4 py-3 text-sm shadow-lg"
          role="alert"
        >
          <span className="font-medium">{msg}</span>
          <button
            onClick={() => dismissNotification(i)}
            className="ml-3 text-white/80 hover:text-white min-touch"
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      ))}

      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Tables</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              activeOrderCount={activeOrdersForTable(table.id).length}
              onClick={() => router.push(`/staff/orders/table/${table.id}`)}
            />
          ))}
        </div>
        {tables.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            No tables configured
          </p>
        )}
      </section>

      {selectedTable && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-700">
              Orders for Table {selectedTable}
            </h2>
            <button
              onClick={() => setSelectedTable(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <div className="space-y-3">
            {activeOrdersForTable(selectedTable).map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                variant="server"
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Active Orders
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No active orders
          </p>
        ) : (
          <div className="space-y-3">
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
      </section>
    </div>
  )
}
