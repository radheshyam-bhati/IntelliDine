'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Table, Order, OrderItem, MenuItem, OrderStatus, PaymentStatus } from '@kitchensync/shared'
import { get, post, patch, put } from '@/lib/api'
import OrderCard from '@/components/OrderCard'
import StatusBadge from '@/components/StatusBadge'

type OrderWithDetails = Order & {
  items?: (OrderItem & { name?: string })[]
  tableLabel?: string
}

interface BillSplit {
  split_index: number
  label: string
  amount: number
  subtotal?: number
  tax_amount?: number
  service_amount?: number
  items: string[]
  payment_status: PaymentStatus
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
  const [billId, setBillId] = useState<string | null>(null)
  const [billLoading, setBillLoading] = useState(false)
  const [splits, setSplits] = useState<BillSplit[]>([])
  const [showSplitModal, setShowSplitModal] = useState<'evenly' | 'by_items' | null>(null)
  const [numSplits, setNumSplits] = useState(2)
  const [splitLabels, setSplitLabels] = useState<string[]>([])
  const [splitItemSelections, setSplitItemSelections] = useState<Record<number, Set<string>>>({})
  const [paidSplits, setPaidSplits] = useState<Set<number>>(new Set())
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
    const res = await post<{ total: number; id?: string }>('/bills', {
      tableId,
      includeServiceCharge: true,
    })
    if (res.success && res.data) {
      setBillAmount(res.data.total)
      setBillId((res.data as any).id || null)
      setSplits([])
      setPaidSplits(new Set())
      setShowSplitModal(null)
    } else {
      setError(res.error || 'Failed to generate bill')
    }
    setBillLoading(false)
  }

  const handleSplitEvenly = async () => {
    if (!billId) return
    setError(null)
    try {
      const res = await post<{ splits: BillSplit[] }>(`/billing/${billId}/split-evenly`, {
        num_splits: numSplits,
      })
      if (res.success && res.data) {
        setSplits(res.data.splits)
        setSplitLabels(res.data.splits.map((s) => s.label))
        setShowSplitModal(null)
      } else {
        setError(res.error || 'Failed to split bill')
      }
    } catch {
      setError('Failed to split bill')
    }
  }

  const handleSplitByItems = async () => {
    if (!billId) return
    setError(null)
    try {
      const assignedItems = Object.entries(splitItemSelections)
        .filter(([, itemIds]) => itemIds.size > 0)
        .map(([idx, itemIds], i) => ({
          label: splitLabels[i] || `Person ${i + 1}`,
          item_ids: Array.from(itemIds),
        }))

      if (assignedItems.length < 2) {
        setError('Assign items to at least 2 people')
        return
      }

      const res = await post<{ splits: BillSplit[] }>(`/billing/${billId}/split-by-items`, {
        splits: assignedItems,
      })
      if (res.success && res.data) {
        setSplits(res.data.splits)
        setShowSplitModal(null)
      } else {
        setError(res.error || 'Failed to split bill')
      }
    } catch {
      setError('Failed to split bill')
    }
  }

  const handleMarkSplitPaid = async (splitIndex: number) => {
    if (!billId) return
    setError(null)
    const res = await put(`/billing/${billId}/payment`, {
      payment_status: 'paid',
    })
    if (res.success) {
      setPaidSplits((prev) => new Set(prev).add(splitIndex))
    } else {
      setError(res.error || 'Failed to update payment status')
    }
  }

  const handleResetBill = () => {
    setBillAmount(null)
    setBillId(null)
    setSplits([])
    setPaidSplits(new Set())
    setShowSplitModal(null)
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
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-500">Bill Total</p>
              <button
                onClick={handleResetBill}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Clear
              </button>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${billAmount.toFixed(2)}
            </p>

            {splits.length === 0 ? (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowSplitModal('evenly')}
                  className="min-touch rounded-md bg-gray-100 text-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-200"
                >
                  Split Evenly
                </button>
                <button
                  onClick={() => {
                    setShowSplitModal('by_items')
                    const allItems = orders.flatMap((o) =>
                      (o.items || []).map((i) => i.id)
                    )
                    setSplitLabels(['Person 1', 'Person 2'])
                    setSplitItemSelections({
                      0: new Set(),
                      1: new Set(),
                    })
                  }}
                  className="min-touch rounded-md bg-gray-100 text-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-200"
                >
                  Split by Items
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Splits
                </p>
                {splits.map((split) => {
                  const isPaid = paidSplits.has(split.split_index)
                  return (
                    <div
                      key={split.split_index}
                      className={`rounded-md border p-3 ${
                        isPaid
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {split.label}
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            ${split.amount.toFixed(2)}
                          </p>
                          {split.subtotal !== undefined && (
                            <p className="text-[10px] text-gray-400">
                              Subtotal: ${split.subtotal.toFixed(2)}
                              {split.tax_amount ? ` + Tax: $${split.tax_amount.toFixed(2)}` : ''}
                              {split.service_amount ? ` + Service: $${split.service_amount.toFixed(2)}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              isPaid
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                          {!isPaid && (
                            <button
                              onClick={() => handleMarkSplitPaid(split.split_index)}
                              className="min-touch rounded-md bg-green-600 text-white px-3 py-1 text-xs font-medium hover:bg-green-700"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-between text-sm font-semibold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total Paid</span>
                  <span>
                    $
                    {splits
                      .filter((s) => paidSplits.has(s.split_index))
                      .reduce((sum, s) => sum + s.amount, 0)
                      .toFixed(2)}
                    {' '}/ ${billAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Split Evenly Modal */}
      {showSplitModal === 'evenly' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Split Evenly</h3>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Number of ways
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setNumSplits(Math.max(2, numSplits - 1))}
                  className="min-touch flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  -
                </button>
                <span className="text-lg font-bold w-8 text-center">{numSplits}</span>
                <button
                  onClick={() => setNumSplits(Math.min(20, numSplits + 1))}
                  className="min-touch flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                ${(billAmount! / numSplits).toFixed(2)} per person
                {billAmount! % numSplits > 0.01 ? ' (last split may vary)' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSplitModal(null)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSplitEvenly}
                className="flex-1 rounded-md bg-gray-900 text-white px-3 py-2 text-sm font-medium hover:bg-gray-800"
              >
                Split
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split by Items Modal */}
      {showSplitModal === 'by_items' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Split by Items</h3>
            <p className="text-xs text-gray-500 mb-4">
              Assign each item to a person. Items not assigned to anyone won&apos;t be included.
            </p>

            <div className="space-y-4 mb-4">
              {splitLabels.map((label, personIdx) => (
                <div key={personIdx} className="rounded-md border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={label}
                      onChange={(e) =>
                        setSplitLabels((prev) => {
                          const next = [...prev]
                          next[personIdx] = e.target.value
                          return next
                        })
                      }
                      className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-gray-900 outline-hidden"
                    />
                    <span className="text-xs text-gray-400">
                      {splitItemSelections[personIdx]?.size || 0} items
                    </span>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {orders.flatMap((o) =>
                      (o.items || []).map((item) => {
                        const isSelected = splitItemSelections[personIdx]?.has(item.id)
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center gap-2 rounded px-2 py-1 cursor-pointer text-xs ${
                              isSelected ? 'bg-amber-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!isSelected}
                              onChange={() => {
                                setSplitItemSelections((prev) => {
                                  const next = { ...prev }
                                  const set = new Set(next[personIdx] || [])
                                  if (set.has(item.id)) {
                                    set.delete(item.id)
                                  } else {
                                    set.add(item.id)
                                  }
                                  next[personIdx] = set
                                  return next
                                })
                              }}
                              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="flex-1 text-gray-700">
                              {item.quantity}x {item.name || item.menu_item_id.slice(0, 8)}
                            </span>
                            <span className="text-gray-400">
                              ${(item.unit_price_at_order * item.quantity).toFixed(2)}
                            </span>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  const idx = splitLabels.length
                  setSplitLabels((prev) => [...prev, `Person ${idx + 1}`])
                  setSplitItemSelections((prev) => ({ ...prev, [idx]: new Set() }))
                }}
                className="w-full rounded-md border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700"
              >
                + Add Person
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSplitModal(null)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSplitByItems}
                className="flex-1 rounded-md bg-gray-900 text-white px-3 py-2 text-sm font-medium hover:bg-gray-800"
              >
                Apply Split
              </button>
            </div>
          </div>
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
