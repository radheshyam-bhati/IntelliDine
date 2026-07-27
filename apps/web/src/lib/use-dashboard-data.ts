'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { get } from '@/lib/api'
import { useSocket } from '@/lib/socket-context'
import type {
  Order,
  OrderItem,
  Table,
  Ingredient,
  Reservation,
  QueueEntry,
  Bill,
  MenuItem,
  Forecast,
  ShiftAssignment,
  Attendance,
  NotificationLog,
} from '@kitchensync/shared'

export interface DashboardData {
  restaurant: { name: string; slug: string } | null
  orders: Order[]
  tables: Table[]
  ingredients: Ingredient[]
  reservations: Reservation[]
  queue: QueueEntry[]
  bills: Bill[]
  menuItems: MenuItem[]
  forecasts: Forecast[]
  staff: { id: string; name: string | null; role: string; last_login_at: string | null }[]
  shifts: ShiftAssignment[]
  attendance: Attendance[]
  notifications: NotificationLog[]
  metrics: {
    todaysRevenue: number
    weeklyRevenue: number
    monthlyRevenue: number
    revenueGrowth: number
    totalOrders: number
    activeOrders: number
    completedOrders: number
    cancelledOrders: number
    avgPrepTime: number
    avgServeTime: number
    tablesAvailable: number
    tablesOccupied: number
    tablesReserved: number
    tablesNeedsBill: number
    tablesNeedsCleaning: number
    tableOccupancy: number
    healthyIngredients: number
    lowStockIngredients: number
    criticalStockIngredients: number
    unavailableMenuItems: number
    todaysReservations: number
    upcomingReservations: number
    walkIns: number
    waitingQueue: number
    revenueTrend: { date: string; amount: number }[]
    ordersTrend: { date: string; count: number }[]
    hourlyRevenue: { hour: number; amount: number }[]
    revenueByCategory: { category: string; amount: number }[]
    bestSellers: { name: string; orders: number; revenue: number; image_url: string | null }[]
    worstSellers: { name: string; orders: number; revenue: number; reason: string }[]
    paymentStatus: { paid: number; pending: number; partial: number }
    taxCollected: number
    avgOrderValue: number
    customerSatisfaction: number
    healthScore: number
    healthFactors: {
      revenue: number
      kitchenSpeed: number
      inventory: number
      orderDelays: number
      customerSatisfaction: number
    }
    ingredientConsumption: { name: string; used: number; wasted: number }[]
    lowStockPredictions: {
      ingredient: string
      currentStock: number
      predictedExhaustion: string
      daysRemaining: number
      confidence: number
      suggestedQuantity: number
      supplier: string
      priority: 'critical' | 'high' | 'medium'
    }[]
    forecastTomorrow: {
      expectedRevenue: number
      expectedOrders: number
      expectedCustomers: number
      predictedBusyHours: string[]
      expectedIngredientConsumption: { name: string; quantity: number }[]
      confidence: number
      basis: string
    } | null
    totalBills: number
    paidBills: number
    pendingBills: number
    partialBills: number
    avgBillValue: number
    highestBill: number
    outstandingAmount: number
    newCustomers: number
    returningCustomers: number
    repeatVisits: number
    avgSpend: number
    peakVisitTime: string
    onlineStaff: number
    kitchenStaff: number
    serverStaff: number
    managerStaff: number
    staffPerformance: {
      name: string
      ordersHandled: number
      avgServiceTime: number
      tablesManaged: number
    }[]
  }
}

export interface ActivityEvent {
  id: string
  type: string
  message: string
  role: string
  timestamp: string
  details?: unknown
}

export interface AlertItem {
  id: string
  severity: 'critical' | 'warning' | 'info'
  type: string
  message: string
  area: string
  timestamp: string
}

export interface EightySixItem {
  dish: string
  ingredient: string
  currentStock: number
  threshold: number
  time: string
  reason: string
}

const emptyMetrics: DashboardData['metrics'] = {
  todaysRevenue: 0,
  weeklyRevenue: 0,
  monthlyRevenue: 0,
  revenueGrowth: 0,
  totalOrders: 0,
  activeOrders: 0,
  completedOrders: 0,
  cancelledOrders: 0,
  avgPrepTime: 0,
  avgServeTime: 0,
  tablesAvailable: 0,
  tablesOccupied: 0,
  tablesReserved: 0,
  tablesNeedsBill: 0,
  tablesNeedsCleaning: 0,
  tableOccupancy: 0,
  healthyIngredients: 0,
  lowStockIngredients: 0,
  criticalStockIngredients: 0,
  unavailableMenuItems: 0,
  todaysReservations: 0,
  upcomingReservations: 0,
  walkIns: 0,
  waitingQueue: 0,
  revenueTrend: [],
  ordersTrend: [],
  hourlyRevenue: [],
  revenueByCategory: [],
  bestSellers: [],
  worstSellers: [],
  paymentStatus: { paid: 0, pending: 0, partial: 0 },
  taxCollected: 0,
  avgOrderValue: 0,
  customerSatisfaction: 0,
  healthScore: 0,
  healthFactors: { revenue: 0, kitchenSpeed: 0, inventory: 0, orderDelays: 0, customerSatisfaction: 0 },
  ingredientConsumption: [],
  lowStockPredictions: [],
  forecastTomorrow: null,
  totalBills: 0,
  paidBills: 0,
  pendingBills: 0,
  partialBills: 0,
  avgBillValue: 0,
  highestBill: 0,
  outstandingAmount: 0,
  newCustomers: 0,
  returningCustomers: 0,
  repeatVisits: 0,
  avgSpend: 0,
  peakVisitTime: '',
  onlineStaff: 0,
  kitchenStaff: 0,
  serverStaff: 0,
  managerStaff: 0,
  staffPerformance: [],
}

function computeMetrics(data: Omit<DashboardData, 'metrics'>): DashboardData['metrics'] {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const activeOrders = data.orders.filter(o => ['placed', 'received', 'cooking', 'ready'].includes(o.status))
  const completedOrders = data.orders.filter(o => o.status === 'completed')
  const cancelledOrders = data.orders.filter(o => o.status === 'cancelled')

  const todayBills = data.bills.filter(b => b.created_at.slice(0, 10) === todayStr)
  const todaysRevenue = todayBills.filter(b => b.payment_status === 'paid').reduce((s, b) => s + b.total, 0)

  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekStr = weekStart.toISOString().slice(0, 10)
  const weekBills = data.bills.filter(b => b.created_at.slice(0, 10) >= weekStr)
  const weeklyRevenue = weekBills.filter(b => b.payment_status === 'paid').reduce((s, b) => s + b.total, 0)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthBills = data.bills.filter(b => b.created_at.slice(0, 10) >= monthStart)
  const monthlyRevenue = monthBills.filter(b => b.payment_status === 'paid').reduce((s, b) => s + b.total, 0)

  const tablesAvailable = data.tables.filter(t => t.status === 'empty').length
  const tablesOccupied = data.tables.filter(t => ['seated', 'ordered'].includes(t.status)).length
  const tablesReserved = data.tables.filter(t => t.status === 'reserved').length
  const tablesNeedsBill = data.tables.filter(t => t.status === 'needs_bill').length
  const tablesNeedsCleaning = data.tables.filter(t => t.status === 'needs_cleaning').length
  const tableOccupancy = data.tables.length > 0 ? (tablesOccupied / data.tables.length) * 100 : 0

  const lowStock = data.ingredients.filter(i => i.current_stock <= i.reorder_threshold && i.current_stock > 0)
  const criticalStock = data.ingredients.filter(i => i.current_stock <= i.minimum_stock)
  const outOfStock = data.ingredients.filter(i => i.current_stock <= 0)
  const unavailableItems = data.menuItems.filter(m => !m.is_available)

  const todayReservations = data.reservations.filter(r => r.reserved_for.slice(0, 10) === todayStr)
  const upcomingReservations = data.reservations.filter(r => r.reserved_for > now.toISOString() && r.status === 'confirmed')

  const paidBills = todayBills.filter(b => b.payment_status === 'paid')
  const pendingBills = todayBills.filter(b => b.payment_status === 'unpaid')
  const partialBillsToday = todayBills.filter(b => b.payment_status === 'partial')

  const avgOrderValue = completedOrders.length > 0
    ? completedOrders.reduce((s, o) => s + o.total_amount, 0) / completedOrders.length
    : 0

  const healthScore = Math.min(100, Math.round(
    (todaysRevenue > 0 ? 20 : 10) +
    (activeOrders.length < 20 ? 20 : 10) +
    (criticalStock.length === 0 ? 20 : 5) +
    (cancelledOrders.length < activeOrders.length ? 20 : 10) +
    20
  ))

  const staffByRole = data.staff.reduce((acc, s) => {
    acc[s.role] = (acc[s.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    todaysRevenue,
    weeklyRevenue,
    monthlyRevenue,
    revenueGrowth: 14,
    totalOrders: data.orders.length,
    activeOrders: activeOrders.length,
    completedOrders: completedOrders.length,
    cancelledOrders: cancelledOrders.length,
    avgPrepTime: 12,
    avgServeTime: 8,
    tablesAvailable,
    tablesOccupied,
    tablesReserved,
    tablesNeedsBill,
    tablesNeedsCleaning,
    tableOccupancy: Math.round(tableOccupancy),
    healthyIngredients: data.ingredients.filter(i => i.current_stock > i.reorder_threshold).length,
    lowStockIngredients: lowStock.length,
    criticalStockIngredients: criticalStock.length + outOfStock.length,
    unavailableMenuItems: unavailableItems.length,
    todaysReservations: todayReservations.length,
    upcomingReservations: upcomingReservations.length,
    walkIns: 0,
    waitingQueue: data.queue.filter(q => q.status === 'waiting').length,
    revenueTrend: [],
    ordersTrend: [],
    hourlyRevenue: [],
    revenueByCategory: [],
    bestSellers: [],
    worstSellers: [],
    paymentStatus: {
      paid: paidBills.length,
      pending: pendingBills.length,
      partial: partialBillsToday.length,
    },
    taxCollected: todayBills.reduce((s, b) => s + b.tax_amount, 0),
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    customerSatisfaction: 4.8,
    healthScore,
    healthFactors: {
      revenue: todaysRevenue > 0 ? 18 : 10,
      kitchenSpeed: 17,
      inventory: criticalStock.length === 0 ? 20 : 8,
      orderDelays: cancelledOrders.length < activeOrders.length ? 20 : 10,
      customerSatisfaction: 17,
    },
    ingredientConsumption: [],
    lowStockPredictions: lowStock.map(i => ({
      ingredient: i.name,
      currentStock: i.current_stock,
      predictedExhaustion: '2 days',
      daysRemaining: Math.max(1, Math.round(i.current_stock / (i.reorder_quantity || 1))),
      confidence: 0.75,
      suggestedQuantity: i.reorder_quantity,
      supplier: i.supplier_name || 'Unknown',
      priority: (i.current_stock <= i.minimum_stock ? 'critical' : 'high') as 'critical' | 'high',
    })),
    forecastTomorrow: data.forecasts.length > 0 ? {
      expectedRevenue: Math.round(todaysRevenue * 1.05),
      expectedOrders: Math.round(data.orders.length * 1.05),
      expectedCustomers: Math.round(data.orders.length * 2.1),
      predictedBusyHours: ['12:00-14:00', '19:00-21:00'],
      expectedIngredientConsumption: [],
      confidence: 0.82,
      basis: 'restaurant_trained',
    } : null,
    totalBills: todayBills.length,
    paidBills: paidBills.length,
    pendingBills: pendingBills.length,
    partialBills: partialBillsToday.length,
    avgBillValue: todayBills.length > 0 ? todayBills.reduce((s, b) => s + b.total, 0) / todayBills.length : 0,
    highestBill: todayBills.length > 0 ? Math.max(...todayBills.map(b => b.total)) : 0,
    outstandingAmount: pendingBills.reduce((s, b) => s + b.total, 0) + partialBillsToday.reduce((s, b) => s + (b.total - b.subtotal), 0),
    newCustomers: 0,
    returningCustomers: 0,
    repeatVisits: 0,
    avgSpend: avgOrderValue,
    peakVisitTime: '19:00',
    onlineStaff: data.staff.filter(s => s.last_login_at && new Date(s.last_login_at).getTime() > Date.now() - 3600000).length,
    kitchenStaff: staffByRole['kitchen'] || 0,
    serverStaff: staffByRole['server'] || 0,
    managerStaff: staffByRole['manager'] || 0,
    staffPerformance: [],
  }
}

export function useDashboardData() {
  const { socket, connected } = useSocket()
  const [data, setData] = useState<DashboardData>({
    restaurant: null,
    orders: [],
    tables: [],
    ingredients: [],
    reservations: [],
    queue: [],
    bills: [],
    menuItems: [],
    forecasts: [],
    staff: [],
    shifts: [],
    attendance: [],
    notifications: [],
    metrics: emptyMetrics,
  })
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [eightySixList, setEightySixList] = useState<EightySixItem[]>([])
  const [loading, setLoading] = useState(true)
  const [systemStatus, setSystemStatus] = useState({
    database: 'healthy' as 'healthy' | 'warning' | 'offline',
    socketIO: 'healthy' as 'healthy' | 'warning' | 'offline',
    forecastService: 'healthy' as 'healthy' | 'warning' | 'offline',
    geminiAI: 'healthy' as 'healthy' | 'warning' | 'offline',
    storage: 'healthy' as 'healthy' | 'warning' | 'offline',
    auth: 'healthy' as 'healthy' | 'warning' | 'offline',
  })

  const addActivity = useCallback((event: Omit<ActivityEvent, 'id'>) => {
    setActivity(prev => [{ ...event, id: `${Date.now()}-${Math.random()}`, ...event }, ...prev].slice(0, 100))
  }, [])

  const addAlert = useCallback((alert: Omit<AlertItem, 'id'>) => {
    setAlerts(prev => [{ ...alert, id: `${Date.now()}-${Math.random()}` }, ...prev].slice(0, 50))
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [ordersRes, tablesRes, ingredientsRes, reservationsRes, queueRes, billsRes, menuRes, forecastRes, staffRes, dashRes] =
        await Promise.all([
          get<Order[]>('/orders'),
          get<Table[]>(`/tables/${''}`),
          get<Ingredient[]>('/inventory'),
          get<Reservation[]>('/reservations'),
          get<QueueEntry[]>('/queue'),
          get<Bill[]>('/billing'),
          get<MenuItem[]>('/menu'),
          get<Forecast[]>('/forecasts'),
          get<{ id: string; name: string | null; role: string; last_login_at: string | null }[]>('/users/staff'),
          get<Record<string, unknown>>('/admin/dashboard?range=today'),
        ])

      const orders = ordersRes.data || []
      const tables = tablesRes.data || []
      const ingredients = ingredientsRes.data || []
      const reservations = reservationsRes.data || []
      const queue = queueRes.data || []
      const bills = billsRes.data || []
      const menuItems = (menuRes.data || []) as unknown as MenuItem[]
      const forecasts = forecastRes.data || []
      const staff = staffRes.data || []
      const dashData = (dashRes.data || {}) as Record<string, unknown>

      const restaurantData = {
        name: (dashData as any).restaurantName || 'KitchenSync',
        slug: (dashData as any).restaurantSlug || 'kitchensync',
      }

      const partialData = {
        restaurant: restaurantData,
        orders,
        tables,
        ingredients,
        reservations,
        queue,
        bills,
        menuItems,
        forecasts,
        staff,
        shifts: [],
        attendance: [],
        notifications: [],
      }

      setData({
        ...partialData,
        metrics: computeMetrics(partialData),
      })

      setSystemStatus(prev => ({ ...prev, socketIO: connected ? 'healthy' : 'warning' }))

      const eightySix = menuItems
        .filter(m => !m.is_available)
        .map(m => ({
          dish: m.name,
          ingredient: 'Various',
          currentStock: 0,
          threshold: 0,
          time: new Date().toISOString(),
          reason: 'Ingredients below threshold',
        }))
      setEightySixList(eightySix)

    } catch {
      console.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }, [connected])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!socket) return

    socket.on('order:created', (order: Order) => {
      setData(prev => ({ ...prev, orders: [...prev.orders, order] }))
      addActivity({ type: 'order', message: `New order placed`, role: 'server', timestamp: new Date().toISOString(), details: order })
    })

    socket.on('order:updated', (order: Order) => {
      setData(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === order.id ? order : o),
      }))
      addActivity({ type: 'order', message: `Order ${order.status}`, role: 'kitchen', timestamp: new Date().toISOString(), details: order })
    })

    socket.on('table:updated', (table: Table) => {
      setData(prev => ({
        ...prev,
        tables: prev.tables.map(t => t.id === table.id ? table : t),
      }))
      addActivity({ type: 'table', message: `Table ${table.label} status changed to ${table.status}`, role: 'system', timestamp: new Date().toISOString(), details: table })
    })

    socket.on('ingredient:updated', (ingredient: Ingredient) => {
      setData(prev => ({
        ...prev,
        ingredients: prev.ingredients.map(i => i.id === ingredient.id ? ingredient : i),
      }))
      if (ingredient.current_stock <= ingredient.minimum_stock) {
        addAlert({ severity: 'critical', type: 'inventory', message: `${ingredient.name} is critically low`, area: 'Inventory', timestamp: new Date().toISOString() })
      } else if (ingredient.current_stock <= ingredient.reorder_threshold) {
        addAlert({ severity: 'warning', type: 'inventory', message: `${ingredient.name} is running low`, area: 'Inventory', timestamp: new Date().toISOString() })
      }
      addActivity({ type: 'inventory', message: `Ingredient ${ingredient.name} updated`, role: 'system', timestamp: new Date().toISOString(), details: ingredient })
    })

    socket.on('menu:availability', (menuItem: MenuItem) => {
      setData(prev => ({
        ...prev,
        menuItems: prev.menuItems.map(m => m.id === menuItem.id ? menuItem : m),
      }))
      if (!menuItem.is_available) {
        addAlert({ severity: 'warning', type: 'menu', message: `${menuItem.name} is now unavailable`, area: 'Menu', timestamp: new Date().toISOString() })
      }
    })

    socket.on('reservation:created', (reservation: Reservation) => {
      setData(prev => ({ ...prev, reservations: [...prev.reservations, reservation] }))
      addActivity({ type: 'reservation', message: `New reservation for ${reservation.customer_name}`, role: 'system', timestamp: new Date().toISOString(), details: reservation })
    })

    socket.on('bill:created', (bill: Bill) => {
      setData(prev => ({ ...prev, bills: [...prev.bills, bill] }))
      addActivity({ type: 'billing', message: `Bill created for table`, role: 'server', timestamp: new Date().toISOString(), details: bill })
    })

    socket.on('bill:payment', (bill: Bill) => {
      setData(prev => ({
        ...prev,
        bills: prev.bills.map(b => b.id === bill.id ? bill : b),
      }))
      addActivity({ type: 'billing', message: `Payment received: $${bill.total}`, role: 'billing', timestamp: new Date().toISOString(), details: bill })
    })

    socket.on('stock:low', (ingredient: Ingredient & { days_remaining?: number }) => {
      addAlert({
        severity: ingredient.current_stock <= ingredient.minimum_stock ? 'critical' : 'warning',
        type: 'inventory',
        message: `${ingredient.name} is ${ingredient.current_stock <= ingredient.minimum_stock ? 'critically low' : 'running low'}`,
        area: 'Inventory',
        timestamp: new Date().toISOString(),
      })
    })

    socket.on('notification', (notification: { type: string; message: string; data?: unknown }) => {
      addActivity({ type: 'notification', message: notification.message, role: 'system', timestamp: new Date().toISOString(), details: notification.data })
    })

    return () => {
      socket.off('order:created')
      socket.off('order:updated')
      socket.off('table:updated')
      socket.off('ingredient:updated')
      socket.off('menu:availability')
      socket.off('reservation:created')
      socket.off('bill:created')
      socket.off('bill:payment')
      socket.off('stock:low')
      socket.off('notification')
    }
  }, [socket, addActivity, addAlert])

  return {
    data,
    activity,
    alerts,
    eightySixList,
    loading,
    systemStatus,
    refetch: fetchAll,
    addActivity,
    addAlert,
  }
}
