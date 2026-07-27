'use client'

import { useState, useEffect } from 'react'
import type { PurchaseOrder, Supplier, PurchaseOrderItem, Ingredient } from '@kitchensync/shared'
import { get, post, put } from '@/lib/api'
import { PageSkeleton } from '@/components/LoadingSkeleton'

export default function AdminPurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [orderItems, setOrderItems] = useState<{ ingredient_id: string; quantity_ordered: number; unit_cost: number }[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const [ordRes, supRes, ingRes] = await Promise.all([
          get<PurchaseOrder[]>('/purchase-orders'),
          get<Supplier[]>('/suppliers'),
          get<Ingredient[]>('/ingredients'),
        ])
        if (ordRes.success && ordRes.data) setOrders(ordRes.data)
        if (supRes.success && supRes.data) setSuppliers(supRes.data)
        if (ingRes.success && ingRes.data) setIngredients(ingRes.data)
      } finally { setLoading(false) }
    }
    fetch()
  }, [])

  const showMsg = (msg: string, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg)
    setTimeout(() => { setError(null); setSuccess(null) }, 3000)
  }

  const handleCreateOrder = async () => {
    if (!selectedSupplier) { setError('Select a supplier'); return }
    if (orderItems.length === 0) { setError('Add at least one item'); return }
    setError(null)

    const itemsWithTotal = orderItems.map(i => ({
      ...i,
      total_cost: i.quantity_ordered * i.unit_cost,
    }))
    const subtotal = itemsWithTotal.reduce((s, i) => s + i.total_cost, 0)

    const res = await post<PurchaseOrder>('/purchase-orders', {
      supplier_id: selectedSupplier,
      items: itemsWithTotal,
      subtotal,
      total_amount: subtotal,
    })
    if (res.success && res.data) {
      setOrders(prev => [res.data!, ...prev])
      showMsg('Purchase order created')
      setShowForm(false); setOrderItems([]); setSelectedSupplier('')
    } else {
      setError(res.error || 'Failed to create order')
    }
  }

  const handleReceive = async (orderId: string) => {
    const res = await put(`/purchase-orders/${orderId}/receive`, {})
    if (res.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'received' as const } : o))
      showMsg('Order marked as received')
    } else {
      setError(res.error || 'Failed to receive order')
    }
  }

  const addOrderItem = () => {
    setOrderItems(prev => [...prev, { ingredient_id: '', quantity_ordered: 1, unit_cost: 0 }])
  }

  const updateOrderItem = (index: number, field: string, value: string | number) => {
    setOrderItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const removeOrderItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index))
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-purple-100 text-purple-700',
    received: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  if (loading) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="min-touch rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">
          {showForm ? 'Cancel' : 'New Order'}
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{success}</div>}

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Supplier *</label>
            <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden">
              <option value="">Select supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">Items</label>
              <button onClick={addOrderItem}
                className="min-touch text-xs text-amber-600 hover:text-amber-700 font-medium">+ Add Item</button>
            </div>
            {orderItems.map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <select value={item.ingredient_id} onChange={e => updateOrderItem(i, 'ingredient_id', e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-amber-500 outline-hidden">
                  <option value="">Select ingredient...</option>
                  {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                </select>
                <input type="number" value={item.quantity_ordered} onChange={e => updateOrderItem(i, 'quantity_ordered', Number(e.target.value))} min={1}
                  className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-xs text-center outline-hidden" placeholder="Qty" />
                <input type="number" value={item.unit_cost} onChange={e => updateOrderItem(i, 'unit_cost', Number(e.target.value))} min={0} step="0.01"
                  className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-xs outline-hidden" placeholder="Cost" />
                <button onClick={() => removeOrderItem(i)}
                  className="min-touch text-red-400 hover:text-red-600 text-xs mt-1">&times;</button>
              </div>
            ))}
            {orderItems.length > 0 && (
              <p className="text-xs text-gray-400">Total: ${orderItems.reduce((s, i) => s + i.quantity_ordered * i.unit_cost, 0).toFixed(2)}</p>
            )}
          </div>

          <button onClick={handleCreateOrder}
            disabled={!selectedSupplier || orderItems.length === 0}
            className="w-full rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
            Create Purchase Order
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No purchase orders yet</p>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <div key={order.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">PO-{order.order_number || order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">{new Date(order.order_date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {order.status}
                  </span>
                  {order.status === 'draft' && (
                    <button onClick={() => handleReceive(order.id)}
                      className="min-touch rounded-md bg-green-600 text-white px-3 py-1 text-xs font-medium hover:bg-green-700">Receive</button>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total: ${Number(order.total_amount).toFixed(2)}</span>
                {order.expected_date && <span>Expected: {new Date(order.expected_date).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
