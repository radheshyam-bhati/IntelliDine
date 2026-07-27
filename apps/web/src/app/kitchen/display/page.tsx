'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Order, OrderItem, OrderStatus, Ingredient, User } from '@kitchensync/shared'
import { get, patch, post } from '@/lib/api'
import { connect } from '@/lib/socket'
import StatusBadge from '@/components/StatusBadge'

type OrderWithDetails = Order & {
  items?: (OrderItem & { name?: string })[],
  tableLabel?: string
}

function elapsedMinutes(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
}

function formatTimer(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

const STATIONS = [
  { id: 'all', label: 'All Orders', icon: '📋' },
  { id: 'grill', label: 'Grill', icon: '🔥' },
  { id: 'fry', label: 'Fry', icon: '🍟' },
  { id: 'salad', label: 'Salad', icon: '🥗' },
  { id: 'pizza', label: 'Pizza', icon: '🍕' },
  { id: 'dessert', label: 'Dessert', icon: '🍰' },
  { id: 'drinks', label: 'Drinks', icon: '🥤' },
  { id: 'expedite', label: 'Expedite', icon: '🏁' },
]

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [staff, setStaff] = useState<User[]>([])
  const [selectedStation, setSelectedStation] = useState<string>('all')
  const [flagModal, setFlagModal] = useState<{ orderId: string; open: boolean }>({ orderId: '', open: false })
  const [selectedIngredient, setSelectedIngredient] = useState('')
  const [flagMsg, setFlagMsg] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [assignChefModal, setAssignChefModal] = useState<{ itemId: string; orderId: string; open: boolean }>({ itemId: '', orderId: '', open: false })
  const [assignStationModal, setAssignStationModal] = useState<{ itemId: string; orderId: string; open: boolean }>({ itemId: '', orderId: '', open: false })
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [newOrderAlert, setNewOrderAlert] = useState(false)

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let socket: ReturnType<typeof connect> | null = null
    controller.signal.addEventListener('abort', () => { if (socket) socket.disconnect() })

    async function init() {
      try {
        setLoading(true)
        const [ordersRes, ingredientsRes, staffRes] = await Promise.all([
          get<OrderWithDetails[]>('/orders/active'),
          get<Ingredient[]>('/ingredients'),
          get<User[]>('/users/staff?role=kitchen'),
        ])
        if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data)
        if (ingredientsRes.success && ingredientsRes.data) setIngredients(ingredientsRes.data)
        if (staffRes.success && staffRes.data) setStaff(staffRes.data)
      } finally { setLoading(false) }

      if (controller.signal.aborted) return
      socket = connect('', '')
      socket.on('order:created', (order) => {
        setOrders((prev) => [...prev, order])
        setNewOrderAlert(true)
        setTimeout(() => setNewOrderAlert(false), 5000)
      })
      socket.on('order:updated', (updatedOrder) => setOrders((prev) => prev.map((o) => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)))
    }

    init()
    return () => { controller.abort() }
  }, [])

  const handleStatusChange = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    const res = await patch(`/orders/${orderId}`, { status: newStatus })
    if (res.success) setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
  }, [])

  const handleItemStatus = useCallback(async (itemId: string, status: string) => {
    const res = await patch(`/orders/items/${itemId}`, { status })
    if (res.success) {
      setOrders(prev => prev.map(order => ({
        ...order,
        items: order.items?.map(item => item.id === itemId ? { ...item, status: status as any } : item)
      })))
    }
  }, [])

  const handleAssignChef = useCallback(async (itemId: string, chefId: string) => {
    const chefName = staff.find(s => s.id === chefId)?.full_name || chefId.slice(0, 6)
    const res = await patch(`/orders/items/${itemId}`, { assigned_chef_id: chefId })
    if (res.success) {
      setOrders(prev => prev.map(order => ({
        ...order,
        items: order.items?.map(item => item.id === itemId ? { ...item, assigned_chef_id: chefId } : item)
      })))
    }
    setAssignChefModal({ itemId: '', orderId: '', open: false })
  }, [staff])

  const handleAssignStation = useCallback(async (itemId: string, station: string) => {
    const res = await patch(`/orders/items/${itemId}`, { station_id: station })
    if (res.success) {
      setOrders(prev => prev.map(order => ({
        ...order,
        items: order.items?.map(item => item.id === itemId ? { ...item, station_id: station } : item)
      })))
    }
    setAssignStationModal({ itemId: '', orderId: '', open: false })
  }, [])

  const handleFlagLow = useCallback(async () => {
    if (!selectedIngredient) return
    setFlagMsg('')
    const res = await post('/inventory/adjust', { ingredientId: selectedIngredient, changeAmount: 0, reason: 'correction' })
    if (res.success) setFlagMsg('Flagged successfully')
    else setFlagMsg(res.error || 'Failed')
    setTimeout(() => { setFlagModal({ orderId: '', open: false }); setFlagMsg(''); setSelectedIngredient('') }, 2000)
  }, [selectedIngredient])

  // Filter by station: check if any item in the order matches the station
  const filteredOrders = selectedStation === 'all'
    ? orders
    : orders.filter(o => o.items?.some(i => i.station_id === selectedStation))

  // Sort by priority + wait time
  const sorted = [...filteredOrders].sort((a, b) => {
    const aMin = elapsedMinutes(a.created_at), bMin = elapsedMinutes(b.created_at)
    const aPrio = a.priority === 'urgent' ? 100 : a.priority === 'high' ? 50 : 0
    const bPrio = b.priority === 'urgent' ? 100 : b.priority === 'high' ? 50 : 0
    return (bMin + bPrio) - (aMin + aPrio)
  })

  // Analytics
  const cookingCount = orders.filter(o => o.status === 'cooking').length
  const waitingCount = orders.filter(o => o.status === 'placed' || o.status === 'received').length
  const avgCookTime = orders.filter(o => o.status === 'ready' || o.status === 'served').reduce((sum, o) => {
    return sum + elapsedMinutes(o.created_at)
  }, 0) / Math.max(orders.filter(o => o.status === 'ready' || o.status === 'served').length, 1)
  const urgentCount = orders.filter(o => elapsedMinutes(o.created_at) > 15 && (o.status === 'cooking' || o.status === 'received')).length
  const unassignedItemsCount = orders.reduce((count, o) => count + (o.items?.filter(i => !i.assigned_chef_id && i.status !== 'cancelled' && i.status !== 'served').length || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="kds-text animate-pulse text-gray-400">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kds p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="kds-text-xl font-bold text-white">Kitchen Display</h1>
          <span className="text-sm text-gray-400">{new Date().toLocaleTimeString()}</span>
          {urgentCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white px-3 py-1 text-xs font-bold animate-pulse">
              {urgentCount} urgent
            </span>
          )}
          {newOrderAlert && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-600 text-white px-3 py-1 text-xs font-bold animate-bounce">
              New order!
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unassignedItemsCount > 0 && (
            <span className="text-xs text-amber-400 font-medium">
              {unassignedItemsCount} unassigned
            </span>
          )}
          <button onClick={() => setShowAnalytics(!showAnalytics)}
            className="min-touch rounded-md border border-gray-600 text-gray-300 px-3 py-1.5 text-xs hover:bg-gray-700 transition-colors">
            {showAnalytics ? 'Hide Stats' : 'Stats'}
          </button>
          <span className="text-sm text-gray-400">{orders.length} active</span>
        </div>
      </div>

      {/* Station Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {STATIONS.map(station => {
          const count = station.id === 'all'
            ? orders.length
            : orders.filter(o => o.items?.some(i => i.station_id === station.id)).length
          return (
            <button key={station.id} onClick={() => setSelectedStation(station.id)}
              className={`min-touch rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                selectedStation === station.id
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              <span className="mr-1.5">{station.icon}</span>
              {station.label}
              {count > 0 && <span className="ml-2 text-xs opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      <div className="flex gap-6">
        {/* Main order grid */}
        <div className="flex-1">
          {sorted.length === 0 ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <div className="kds-text-xl text-gray-500 mb-2">All Caught Up</div>
                <div className="text-gray-600">No orders in this station</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {sorted.map((order) => {
                const mins = elapsedMinutes(order.created_at)
                const urgency = mins > 20 ? 'border-red-500' : mins > 10 ? 'border-yellow-500' : 'border-gray-700'
                const urgencyBg = mins > 20 ? 'bg-red-900/20' : mins > 10 ? 'bg-yellow-900/20' : ''

                return (
                  <div key={order.id} className={`rounded-xl border-2 ${urgency} ${urgencyBg} bg-gray-800 p-4 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-black/20`}>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="kds-text-lg font-bold text-white">#{order.id.slice(0, 6)}</span>
                        {order.priority === 'urgent' && (
                          <span className="inline-flex items-center rounded-full bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 animate-pulse">URGENT</span>
                        )}
                        {order.priority === 'high' && (
                          <span className="inline-flex items-center rounded-full bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5">HIGH</span>
                        )}
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    {/* Timer + Table */}
                    <div className="flex items-center justify-between">
                      <div className={`kds-text-lg font-mono font-bold ${mins > 20 ? 'text-red-400' : mins > 10 ? 'text-yellow-400' : 'text-gray-300'}`}>
                        {formatTimer(mins)}
                      </div>
                      <div className="text-sm text-gray-400">
                        Table {order.tableLabel || order.table_id.slice(0, 6)}
                      </div>
                    </div>

                    {/* Items with per-item status, chef assignment, and station */}
                    <div className="flex-1 space-y-2">
                      {order.items?.map((item) => {
                        const itemMins = item.started_at ? elapsedMinutes(item.started_at) : mins
                        const assignedChef = item.assigned_chef_id ? staff.find(s => s.id === item.assigned_chef_id) : null

                        return (
                          <div key={item.id} className={`rounded-lg p-2.5 ${
                            item.status === 'cooking' ? 'bg-yellow-900/20 border border-yellow-700/30'
                            : item.status === 'ready' ? 'bg-green-900/20 border border-green-700/30'
                            : item.status === 'cancelled' ? 'bg-gray-800/50 border border-gray-700/30 opacity-60'
                            : 'bg-gray-700/30'
                          }`}>
                            <div className="flex justify-between items-center">
                              <span className={`kds-text font-medium ${item.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-white'}`}>
                                {item.quantity}x {item.name || 'Item'}
                              </span>
                              {item.status === 'cooking' && (
                                <span className="text-xs font-mono text-yellow-400">{formatTimer(itemMins)}</span>
                              )}
                            </div>

                            {/* Chef & Station badges */}
                            <div className="flex items-center gap-1.5 mt-1">
                              {assignedChef ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-900/40 text-blue-300 px-2 py-0.5 text-[10px] font-medium">
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <circle cx="5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1"/>
                                    <path d="M1 9c0-2.5 1.5-4 4-4s4 1.5 4 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                                  </svg>
                                  {assignedChef.full_name || 'Chef'}
                                </span>
                              ) : (
                                item.status !== 'cancelled' && item.status !== 'served' && (
                                  <button onClick={() => setAssignChefModal({ itemId: item.id, orderId: order.id, open: true })}
                                    className="min-touch inline-flex items-center gap-1 rounded-full bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200 px-2 py-0.5 text-[10px] font-medium transition-colors">
                                    + Assign Chef
                                  </button>
                                )
                              )}

                              {item.station_id ? (
                                <span className="inline-flex items-center rounded-full bg-gray-700 text-gray-300 px-2 py-0.5 text-[10px] font-medium">
                                  {STATIONS.find(s => s.id === item.station_id)?.icon} {item.station_id}
                                </span>
                              ) : (
                                item.status !== 'cancelled' && item.status !== 'served' && (
                                  <button onClick={() => setAssignStationModal({ itemId: item.id, orderId: order.id, open: true })}
                                    className="min-touch inline-flex items-center gap-1 rounded-full bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200 px-2 py-0.5 text-[10px] font-medium transition-colors">
                                    + Station
                                  </button>
                                )
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-1.5 mt-1.5">
                              {item.status === 'pending' && (
                                <button onClick={() => handleItemStatus(item.id, 'cooking')}
                                  className="min-touch rounded bg-yellow-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-yellow-500 transition-colors">Cook</button>
                              )}
                              {item.status === 'cooking' && (
                                <button onClick={() => handleItemStatus(item.id, 'ready')}
                                  className="min-touch rounded bg-green-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-green-500 transition-colors">Done</button>
                              )}
                              {item.status === 'pending' && (
                                <button onClick={() => handleItemStatus(item.id, 'cancelled')}
                                  className="min-touch rounded bg-gray-700 text-gray-400 px-2.5 py-1 text-xs font-medium hover:bg-gray-600 transition-colors">Cancel</button>
                              )}
                              {item.special_request && (
                                <span className="text-xs text-yellow-300 italic ml-1 truncate">Note: {item.special_request}</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Order-level actions */}
                    <div className="flex flex-col gap-2 mt-1">
                      {order.status === 'received' && (
                        <button onClick={() => handleStatusChange(order.id, 'cooking')}
                          className="min-touch rounded-lg bg-yellow-600 text-white px-4 py-3 kds-text font-bold hover:bg-yellow-500 transition-colors focus:outline-hidden focus:ring-2 focus:ring-yellow-400">
                          Start Cooking
                        </button>
                      )}
                      {order.status === 'cooking' && (
                        <button onClick={() => handleStatusChange(order.id, 'ready')}
                          className="min-touch rounded-lg bg-green-600 text-white px-4 py-3 kds-text font-bold hover:bg-green-500 transition-colors focus:outline-hidden focus:ring-2 focus:ring-green-400">
                          All Done — Mark Ready
                        </button>
                      )}
                      {order.status === 'placed' && (
                        <button onClick={() => handleStatusChange(order.id, 'received')}
                          className="min-touch rounded-lg bg-blue-600 text-white px-4 py-3 kds-text font-bold hover:bg-blue-500 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-400">
                          Accept Order
                        </button>
                      )}
                      <button onClick={() => setFlagModal({ orderId: order.id, open: true })}
                        className="min-touch rounded-lg border border-gray-600 text-gray-400 px-3 py-2 text-sm hover:bg-gray-700 hover:text-gray-200 transition-colors">
                        ⚠️ Flag Ingredient Low
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Analytics sidebar */}
        {showAnalytics && (
          <div className="w-64 flex-shrink-0 space-y-3">
            <div className="rounded-xl bg-gray-800 p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Kitchen Stats</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Waiting</p>
                  <p className="kds-text-lg font-bold text-yellow-400">{waitingCount}</p>
                </div>
                <div className="h-px bg-gray-700" />
                <div>
                  <p className="text-xs text-gray-500">In Progress</p>
                  <p className="kds-text-lg font-bold text-blue-400">{cookingCount}</p>
                </div>
                <div className="h-px bg-gray-700" />
                <div>
                  <p className="text-xs text-gray-500">Avg Cook Time</p>
                  <p className="kds-text-lg font-bold text-green-400">{Math.round(avgCookTime)} min</p>
                </div>
                <div className="h-px bg-gray-700" />
                <div>
                  <p className="text-xs text-gray-500">Urgent ({'>'}15 min)</p>
                  <p className="kds-text-lg font-bold text-red-400">{urgentCount}</p>
                </div>
                <div className="h-px bg-gray-700" />
                <div>
                  <p className="text-xs text-gray-500">Unassigned Items</p>
                  <p className={`kds-text-lg font-bold ${unassignedItemsCount > 0 ? 'text-amber-400' : 'text-green-400'}`}>{unassignedItemsCount}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-gray-800 p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Station Load</h3>
              <div className="space-y-2">
                {STATIONS.filter(s => s.id !== 'all').map(station => {
                  const count = orders.reduce((sum, o) => sum + (o.items?.filter(i => i.station_id === station.id && i.status !== 'ready' && i.status !== 'served' && i.status !== 'cancelled').length || 0), 0)
                  return (
                    <div key={station.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{station.icon} {station.label}</span>
                      <span className={`font-medium ${count > 5 ? 'text-red-400' : count > 2 ? 'text-yellow-400' : 'text-gray-300'}`}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl bg-gray-800 p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Low Stock Items</h3>
              {ingredients.filter(i => i.current_stock <= i.reorder_threshold).length === 0 ? (
                <p className="text-xs text-gray-500">All stocked</p>
              ) : (
                <div className="space-y-2">
                  {ingredients.filter(i => i.current_stock <= i.reorder_threshold).slice(0, 5).map(ing => (
                    <div key={ing.id} className="flex justify-between text-xs">
                      <span className="text-gray-400">{ing.name}</span>
                      <span className="text-red-400 font-medium">{ing.current_stock} {ing.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-full rounded-lg border border-gray-700 text-gray-400 px-3 py-2 text-xs hover:bg-gray-700 transition-colors">
              {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
            </button>
          </div>
        )}
      </div>

      {/* Assign Chef Modal */}
      {assignChefModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-80 shadow-2xl border border-gray-700">
            <h3 className="text-white font-bold mb-3 text-lg">Assign Chef</h3>
            <div className="space-y-2 mb-4">
              {staff.filter(s => s.role === 'kitchen' || !s.role).length === 0 && (
                <p className="text-sm text-gray-400">No kitchen staff found</p>
              )}
              {staff.filter(s => s.role === 'kitchen' || !s.role).map(chef => {
                const isAssigned = assignChefModal.itemId && orders.some(o => o.items?.some(i => i.id === assignChefModal.itemId && i.assigned_chef_id === chef.id))
                return (
                  <button key={chef.id} onClick={() => handleAssignChef(assignChefModal.itemId, chef.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isAssigned ? 'bg-blue-900/40 border border-blue-700/50' : 'bg-gray-700 hover:bg-gray-600'
                    }`}>
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium">
                      {chef.full_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{chef.full_name || chef.email || 'Chef'}</p>
                      <p className="text-xs text-gray-400">{chef.role || 'kitchen'}</p>
                    </div>
                    {isAssigned && <span className="ml-auto text-xs text-blue-400">✓ Assigned</span>}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setAssignChefModal({ itemId: '', orderId: '', open: false })}
              className="w-full rounded-lg border border-gray-600 text-gray-300 px-3 py-2 text-sm hover:bg-gray-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Assign Station Modal */}
      {assignStationModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-80 shadow-2xl border border-gray-700">
            <h3 className="text-white font-bold mb-3 text-lg">Assign Station</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {STATIONS.filter(s => s.id !== 'all').map(station => (
                <button key={station.id} onClick={() => handleAssignStation(assignStationModal.itemId, station.id)}
                  className="flex flex-col items-center gap-1 rounded-lg bg-gray-700 hover:bg-gray-600 px-3 py-3 transition-colors">
                  <span className="text-xl">{station.icon}</span>
                  <span className="text-xs text-white font-medium">{station.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setAssignStationModal({ itemId: '', orderId: '', open: false })}
              className="w-full rounded-lg border border-gray-600 text-gray-300 px-3 py-2 text-sm hover:bg-gray-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {flagModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-80 shadow-2xl border border-gray-700">
            <h3 className="text-white font-bold mb-3 text-lg">Flag Ingredient Low</h3>
            {flagMsg ? (
              <p className="text-sm text-gray-300">{flagMsg}</p>
            ) : (
              <>
                <select value={selectedIngredient} onChange={(e) => setSelectedIngredient(e.target.value)}
                  className="w-full rounded-lg bg-gray-700 text-white px-3 py-2.5 text-sm border border-gray-600 mb-4 focus:outline-hidden focus:border-amber-500">
                  <option value="">Select ingredient...</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.current_stock} {ing.unit})</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setFlagModal({ orderId: '', open: false })}
                    className="flex-1 rounded-lg border border-gray-600 text-gray-300 px-3 py-2 text-sm hover:bg-gray-700 transition-colors">Cancel</button>
                  <button onClick={handleFlagLow} disabled={!selectedIngredient}
                    className="flex-1 rounded-lg bg-red-600 text-white px-3 py-2 text-sm font-medium hover:bg-red-500 disabled:opacity-50 transition-colors">Flag Low</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
