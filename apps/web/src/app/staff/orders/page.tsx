'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Table, Order, OrderItem, MenuItem, OrderStatus } from '@kitchensync/shared'
import { get, post, patch } from '@/lib/api'
import { connect } from '@/lib/socket'

import TableCard from '@/components/TableCard'
import OrderCard from '@/components/OrderCard'

type OrderWithDetails = Order & {
  items?: (OrderItem & { name?: string })[]
  tableLabel?: string
}

type ViewMode = 'grid' | 'floorplan'

export default function StaffOrdersPage() {
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>([])
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [notifications, setNotifications] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('floorplan')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [showQuickOrder, setShowQuickOrder] = useState(false)
  const [quickOrderTable, setQuickOrderTable] = useState<string | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [quickOrderItems, setQuickOrderItems] = useState<Record<string, number>>({})
  const [quickOrderNote, setQuickOrderNote] = useState('')
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null)
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null)
  const [sections, setSections] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let socket: ReturnType<typeof connect> | null = null
    controller.signal.addEventListener('abort', () => {
      if (socket) socket.disconnect()
    })

    async function init() {
      if (controller.signal.aborted) return
      socket = connect('', '')

      socket.on('order:created', (order) => {
        setOrders((prev) => [...prev, order])
        if (order.status === 'ready') {
          setNotifications((prev) => [
            ...prev,
            `Order ready for table ${(order as OrderWithDetails).tableLabel || order.table_id.slice(0, 6)}`,
          ])
          setTimeout(() => { setNotifications((prev) => prev.slice(1)) }, 8000)
        }
      })
      socket.on('order:updated', (updatedOrder) => {
        setOrders((prev) => prev.map((o) => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
      })
      socket.on('table:updated', (updatedTable) => {
        setTables((prev) => prev.map((t) => t.id === updatedTable.id ? updatedTable : t))
      })
    }

    init()
    return () => { controller.abort() }
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [tablesRes, ordersRes, menuRes] = await Promise.all([
          get<Table[]>('/tables'),
          get<OrderWithDetails[]>('/orders/active'),
          get<MenuItem[]>('/menu-items'),
        ])
        if (tablesRes.success && tablesRes.data) {
          setTables(tablesRes.data)
          const uniqueSections = Array.from(new Set(tablesRes.data.map(t => t.section).filter(Boolean) as string[]))
          setSections(uniqueSections)
        }
        if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data)
        if (menuRes.success && menuRes.data) setMenuItems(menuRes.data)
      } finally { setLoading(false) }
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
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
    }
  }

  const msg = (text: string, isError = false) => {
    if (isError) setError(text); else setSuccessMsg(text)
    setTimeout(() => { setError(null); setSuccessMsg(null) }, 3000)
  }

  const openQuickOrder = (tableId: string) => {
    setQuickOrderTable(tableId)
    setQuickOrderItems({})
    setQuickOrderNote('')
    setShowQuickOrder(true)
  }

  const handleQuickOrder = async () => {
    if (!quickOrderTable) return
    const itemsToAdd = Object.entries(quickOrderItems).filter(([, qty]) => qty > 0)
    if (itemsToAdd.length === 0) { msg('Select at least one item', true); return }

    const res = await post('/orders', {
      tableId: quickOrderTable,
      notes: quickOrderNote || undefined,
      items: itemsToAdd.map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
    })
    if (res.success) {
      msg('Order created!')
      setShowQuickOrder(false)
      setQuickOrderTable(null)
      const ordersRes = await get<OrderWithDetails[]>('/orders/active')
      if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data)
    } else {
      msg(res.error || 'Failed to create order', true)
    }
  }

  const handleTransferOrder = async () => {
    if (!mergeSourceId || !transferTargetId) return
    const res = await post('/orders/transfer', {
      sourceTableId: mergeSourceId,
      targetTableId: transferTargetId,
    })
    if (res.success) {
      msg('Orders transferred!')
      setShowTransferModal(false)
      setMergeSourceId(null)
      setTransferTargetId(null)
      const [ordersRes, tablesRes] = await Promise.all([
        get<OrderWithDetails[]>('/orders/active'),
        get<Table[]>('/tables'),
      ])
      if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data)
      if (tablesRes.success && tablesRes.data) setTables(tablesRes.data)
    } else {
      msg(res.error || 'Transfer failed', true)
    }
  }

  const handleMergeTables = async (targetTableId: string) => {
    if (!mergeSourceId) return
    const res = await post('/orders/merge', {
      sourceTableId: mergeSourceId,
      targetTableId,
    })
    if (res.success) {
      msg('Tables merged!')
      setMergeSourceId(null)
      const [ordersRes, tablesRes] = await Promise.all([
        get<OrderWithDetails[]>('/orders/active'),
        get<Table[]>('/tables'),
      ])
      if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data)
      if (tablesRes.success && tablesRes.data) setTables(tablesRes.data)
    } else {
      msg(res.error || 'Merge failed', true)
    }
  }

  const dismissNotification = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index))
  }

  // Filter tables
  const filteredTables = tables.filter(t => {
    if (searchQuery && !t.label.toLowerCase().includes(searchQuery.toLowerCase()) && !t.section?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (selectedSection !== 'all' && t.section !== selectedSection) return false
    return true
  })

  const sectionColors: Record<string, string> = {
    'main': 'bg-blue-500',
    'outdoor': 'bg-emerald-500',
    'bar': 'bg-amber-500',
    'vip': 'bg-purple-500',
    'patio': 'bg-teal-500',
    'lounge': 'bg-pink-500',
    'private': 'bg-indigo-500',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Notifications */}
      {notifications.map((msg, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg bg-green-600 text-white px-4 py-3 text-sm shadow-lg" role="alert">
          <span className="font-medium">{msg}</span>
          <button onClick={() => dismissNotification(i)} className="ml-3 text-white/80 hover:text-white min-touch" aria-label="Dismiss">&times;</button>
        </div>
      ))}

      {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>}
      {successMsg && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{successMsg}</div>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Floor Plan</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('floorplan')}
              className={`min-touch px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'floorplan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              Floor
            </button>
            <button onClick={() => setViewMode('grid')}
              className={`min-touch px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              Grid
            </button>
          </div>
          {mergeSourceId && (
            <button onClick={() => setMergeSourceId(null)}
              className="min-touch rounded-md border border-red-300 text-red-600 px-3 py-1.5 text-xs font-medium hover:bg-red-50">
              Cancel Merge
            </button>
          )}
        </div>
      </div>

      {/* Search & Section Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tables..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-hidden" />
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setSelectedSection('all')}
          className={`min-touch rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
            selectedSection === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          All ({tables.length})
        </button>
        {sections.map(s => (
          <button key={s} onClick={() => setSelectedSection(s)}
            className={`min-touch rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              selectedSection === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s.charAt(0).toUpperCase() + s.slice(1)} ({tables.filter(t => t.section === s).length})
          </button>
        ))}
      </div>

      {/* Tables Display */}
      {viewMode === 'floorplan' ? (
        /* Floor Plan View */
        <div className="relative min-h-[500px] bg-white rounded-xl border border-gray-200 p-4">
          {filteredTables.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-sm text-gray-400">No tables match your criteria</p>
            </div>
          ) : (
            <div className="relative w-full h-full" style={{ minHeight: '500px' }}>
              {/* Render sections as labeled zones */}
              {sections.map(section => {
                const sectionTables = filteredTables.filter(t => t.section === section)
                if (sectionTables.length === 0) return null
                return (
                  <div key={section} className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${sectionColors[section] || 'bg-gray-400'}`} />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{section}</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {sectionTables.map(table => {
                        const tableOrders = activeOrdersForTable(table.id)
                        const isMerging = mergeSourceId === table.id
                        const canMergeTarget = mergeSourceId && mergeSourceId !== table.id

                        return (
                          <div key={table.id} className="relative">
                            <div
                              onClick={() => {
                                if (canMergeTarget) {
                                  handleMergeTables(table.id)
                                  return
                                }
                                router.push(`/staff/orders/table/${table.id}`)
                              }}
                              className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                                table.status === 'empty'
                                  ? 'border-gray-200 bg-white hover:border-gray-300'
                                  : table.status === 'seated'
                                  ? 'border-blue-400 bg-blue-50 hover:border-blue-500'
                                  : table.status === 'ordered'
                                  ? 'border-amber-400 bg-amber-50 hover:border-amber-500'
                                  : table.status === 'needs_bill'
                                  ? 'border-orange-400 bg-orange-50 hover:border-orange-500'
                                  : table.status === 'reserved'
                                  ? 'border-purple-300 bg-purple-50 hover:border-purple-400'
                                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                              } ${isMerging ? 'ring-2 ring-red-400' : ''} ${canMergeTarget ? 'ring-2 ring-green-400' : ''}`}
                            >
                              {/* Table label */}
                              <span className="text-sm font-bold text-gray-900">{table.label}</span>
                              {/* Capacity icon */}
                              <span className="text-[10px] text-gray-400 mt-0.5">
                                <svg className="w-3 h-3 inline mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {table.capacity}
                              </span>
                              {/* Order count badge */}
                              {tableOrders.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                                  {tableOrders.length}
                                </span>
                              )}
                            </div>
                            {/* Quick actions */}
                            <div className="flex gap-1 mt-1 justify-center">
                              <button onClick={(e) => { e.stopPropagation(); openQuickOrder(table.id) }}
                                className="min-touch text-[10px] text-amber-600 hover:text-amber-700 font-medium p-0.5"
                                title="Quick Order">
                                + Order
                              </button>
                              {tableOrders.length > 0 && (
                                <button onClick={(e) => { e.stopPropagation(); setMergeSourceId(table.id) }}
                                  className="min-touch text-[10px] text-blue-600 hover:text-blue-700 font-medium p-0.5"
                                  title={mergeSourceId ? 'Select target to merge' : 'Merge from here'}>
                                  {mergeSourceId === table.id ? 'Merging...' : 'Merge'}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Tables without section */}
              {filteredTables.filter(t => !t.section).length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Unassigned</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {filteredTables.filter(t => !t.section).map(table => {
                      const tableOrders = activeOrdersForTable(table.id)
                      return (
                        <div key={table.id} className="relative">
                          <div onClick={() => router.push(`/staff/orders/table/${table.id}`)}
                            className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                              table.status === 'empty' ? 'border-gray-200 bg-white' : table.status === 'ordered' ? 'border-amber-400 bg-amber-50' : 'border-blue-400 bg-blue-50'
                            }`}>
                            <span className="text-sm font-bold text-gray-900">{table.label}</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">Cap. {table.capacity}</span>
                            {tableOrders.length > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">{tableOrders.length}</span>
                            )}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); openQuickOrder(table.id) }}
                            className="min-touch w-full text-[10px] text-amber-600 hover:text-amber-700 font-medium mt-0.5">+ Order</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <>
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-3">Tables</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredTables.map((table) => {
                const tableOrders = activeOrdersForTable(table.id)
                return (
                  <div key={table.id}>
                    <TableCard
                      table={table}
                      activeOrderCount={tableOrders.length}
                      onClick={() => router.push(`/staff/orders/table/${table.id}`)}
                    />
                    <div className="flex gap-1 mt-1 justify-center">
                      <button onClick={(e) => { e.stopPropagation(); openQuickOrder(table.id) }}
                        className="min-touch text-[10px] text-amber-600 hover:text-amber-700 font-medium">+ Quick Order</button>
                      {mergeSourceId && mergeSourceId !== table.id && (
                        <button onClick={(e) => { e.stopPropagation(); handleMergeTables(table.id) }}
                          className="min-touch text-[10px] text-green-600 hover:text-green-700 font-medium">Merge Here</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {tables.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No tables configured</p>
            )}
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-3">Active Orders</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No active orders</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} variant="server" onStatusChange={handleStatusChange} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Quick Order Modal */}
      {showQuickOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">Quick Order</h3>
              <button onClick={() => { setShowQuickOrder(false); setQuickOrderTable(null) }}
                className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>

            {quickOrderTable && (
              <p className="text-xs text-gray-500 mb-4">
                Creating order for Table {tables.find(t => t.id === quickOrderTable)?.label || quickOrderTable.slice(0, 6)}
              </p>
            )}

            {menuItems.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No menu items available</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {menuItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-700 truncate">{item.name}</p>
                        {!item.is_available && <span className="text-[10px] text-red-500 font-medium">Unavailable</span>}
                      </div>
                      <p className="text-xs text-gray-400">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button onClick={() => setQuickOrderItems(prev => ({
                        ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1)
                      }))} disabled={!item.is_available}
                        className="min-touch flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 disabled:opacity-30">
                        -
                      </button>
                      <span className="text-sm font-medium w-5 text-center">{quickOrderItems[item.id] || 0}</span>
                      <button onClick={() => setQuickOrderItems(prev => ({
                        ...prev, [item.id]: (prev[item.id] || 0) + 1
                      }))} disabled={!item.is_available}
                        className="min-touch flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 disabled:opacity-30">
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Order Note</label>
              <input type="text" value={quickOrderNote} onChange={e => setQuickOrderNote(e.target.value)}
                placeholder="Any special instructions..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 outline-hidden" />
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowQuickOrder(false); setQuickOrderTable(null) }}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleQuickOrder}
                disabled={Object.values(quickOrderItems).filter(q => q > 0).length === 0}
                className="flex-1 rounded-lg bg-gray-900 text-white px-3 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-semibold text-gray-900 mb-4">Transfer / Merge Tables</h3>
            <p className="text-xs text-gray-500 mb-4">
              Select the target table to transfer orders from Table {tables.find(t => t.id === mergeSourceId)?.label || ''}
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto mb-4">
              {tables.filter(t => t.id !== mergeSourceId).map(t => (
                <button key={t.id} onClick={() => setTransferTargetId(t.id)}
                  className={`rounded-lg border-2 p-3 text-left transition-all ${
                    transferTargetId === t.id ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <p className="text-sm font-medium text-gray-900">{t.label}</p>
                  <p className="text-[10px] text-gray-400">{t.section || 'No section'} · Cap. {t.capacity}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowTransferModal(false); setMergeSourceId(null) }}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleTransferOrder} disabled={!transferTargetId}
                className="flex-1 rounded-lg bg-amber-600 text-white px-3 py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50">Transfer</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-500">
        <div className="rounded-lg bg-white border border-gray-100 p-3">
          <p className="font-semibold text-gray-900">{tables.filter(t => t.status !== 'empty').length}/{tables.length}</p>
          <p>Tables occupied</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-100 p-3">
          <p className="font-semibold text-gray-900">{orders.length}</p>
          <p>Active orders</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-100 p-3">
          <p className="font-semibold text-amber-600">{orders.filter(o => o.status === 'ready').length}</p>
          <p>Ready to serve</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-100 p-3">
          <p className="font-semibold text-green-600">{tables.filter(t => t.status === 'empty').length}</p>
          <p>Available tables</p>
        </div>
      </div>
    </div>
  )
}
