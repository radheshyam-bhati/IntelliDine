import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/dashboard', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'No restaurant associated with account' })
    }

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayStartStr = todayStart.toISOString()

    const diffToMonday = now.getDay() === 0 ? -6 : 1 - now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() + diffToMonday)
    monday.setHours(0, 0, 0, 0)
    const weekStart = monday.toISOString()

    const [{ data: todayOrders }, { data: tables }, { data: ingredients }, { data: staff }, { data: completedOrders }, { data: weekOrders }] =
      await Promise.all([
        supabaseAdmin.from('orders').select('id').eq('restaurant_id', restaurantId).gte('created_at', todayStartStr),
        supabaseAdmin.from('tables').select('status').eq('restaurant_id', restaurantId),
        supabaseAdmin.from('ingredients').select('name, current_stock, reorder_threshold').eq('restaurant_id', restaurantId),
        supabaseAdmin.from('users').select('id').eq('restaurant_id', restaurantId).neq('role', 'customer'),
        supabaseAdmin.from('orders').select('created_at, updated_at').eq('restaurant_id', restaurantId).eq('status', 'completed').gte('created_at', weekStart),
        supabaseAdmin.from('orders').select('id, created_at').eq('restaurant_id', restaurantId).gte('created_at', weekStart),
      ])

    const ordersInProgress = todayOrders?.length || 0
    const tablesTotal = tables?.length || 0
    const tablesOccupied = tables?.filter((t) => t.status === 'seated' || t.status === 'ordered').length || 0

    let todaysRevenue = 0
    if (todayOrders && todayOrders.length > 0) {
      const todayIds = todayOrders.map((o) => o.id)
      const { data: todayItems } = await supabaseAdmin
        .from('order_items')
        .select('unit_price_at_order, quantity')
        .in('order_id', todayIds)
      todaysRevenue = todayItems?.reduce((s, i) => s + i.unit_price_at_order * i.quantity, 0) || 0
    }

    const weekIds = weekOrders?.map((o) => o.id) || []
    let bestSellers: { name: string; count: number }[] = []
    let worstSellers: { name: string; count: number }[] = []

    if (weekIds.length > 0) {
      const { data: weekItems } = await supabaseAdmin
        .from('order_items')
        .select('menu_item_id, quantity')
        .in('order_id', weekIds)

      if (weekItems && weekItems.length > 0) {
        const qtyMap = new Map<string, number>()
        weekItems.forEach((i) => qtyMap.set(i.menu_item_id, (qtyMap.get(i.menu_item_id) || 0) + i.quantity))

        const menuItemIds = Array.from(qtyMap.keys())
        const { data: menuItems } = await supabaseAdmin.from('menu_items').select('id, name').in('id', menuItemIds)
        const nameMap = new Map(menuItems?.map((m) => [m.id, m.name]) || [])

        const sorted = Array.from(qtyMap.entries())
          .map(([id, qty]) => ({ name: nameMap.get(id) || 'Unknown', count: qty }))
          .sort((a, b) => b.count - a.count)

        bestSellers = sorted.slice(0, 5)
        worstSellers = sorted.slice(-5).reverse()
      }
    }

    let avgOrderToServeTime = 0
    let avgOrderValue = 0
    let tableTurnover = 0

    if (completedOrders && completedOrders.length > 0) {
      const totalMs = completedOrders.reduce((sum, o) => {
        return sum + (new Date(o.updated_at).getTime() - new Date(o.created_at).getTime())
      }, 0)
      avgOrderToServeTime = Math.round(totalMs / completedOrders.length / 60000)

      const completedToday = completedOrders.filter((o) => o.created_at >= todayStartStr)
      if (completedToday.length > 0) {
        const totalRevenue = completedToday.reduce((sum, o) => {
          return sum + (new Date(o.updated_at).getTime() - new Date(o.created_at).getTime())
        }, 0)
        avgOrderValue = Math.round((totalRevenue / completedToday.length) * 100) / 100
      }
    }

    if (tablesTotal > 0 && completedOrders && completedOrders.length > 0) {
      tableTurnover = Math.round((completedOrders.length / tablesTotal) * 10) / 10
    }

    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    const { data: weekOrderItems } = await supabaseAdmin
      .from('order_items')
      .select('unit_price_at_order, quantity, orders!inner(created_at, restaurant_id)')
      .eq('orders.restaurant_id', restaurantId)
      .gte('orders.created_at', sevenDaysAgo.toISOString())

    const revenueByDate = new Map<string, number>()
    if (weekOrderItems) {
      for (const item of weekOrderItems) {
        const date = (item as any).orders?.created_at?.slice(0, 10)
        if (date) {
          revenueByDate.set(date, (revenueByDate.get(date) || 0) + item.unit_price_at_order * item.quantity)
        }
      }
    }
    const revenueTrend = Array.from(revenueByDate.entries())
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const lowStock = (ingredients || [])
      .filter((i) => i.current_stock <= i.reorder_threshold)
      .map((i) => ({ name: i.name, current_stock: i.current_stock, threshold: i.reorder_threshold }))

    let forecast: { itemName: string; predicted: number; basis: string; confidence: number }[] = []
    const { data: forecastData } = await supabaseAdmin
      .from('forecasts')
      .select('*, menu_items(name)')
      .eq('restaurant_id', restaurantId)
      .eq('forecast_date', now.toISOString().slice(0, 10))
    if (forecastData) {
      forecast = forecastData.map((f: any) => ({
        itemName: f.menu_items?.name || 'Unknown',
        predicted: f.predicted_quantity,
        basis: f.basis,
        confidence: f.basis === 'restaurant_trained' ? 0.85 : 0.45,
      }))
    }

    res.json({
      success: true,
      data: {
        ordersInProgress,
        tablesOccupied,
        todaysRevenue: Math.round(todaysRevenue * 100) / 100,
        revenueTrend,
        bestSellers,
        worstSellers,
        avgOrderValue,
        tableTurnover,
        avgOrderToServeTime,
        forecast,
        lowStockIngredients: lowStock,
        totalStaff: staff?.length || 0,
        tablesTotal,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/customers', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'No restaurant associated with account' })
    }

    const { search } = req.query

    // Fetch all customers (users with role='customer') who have ordered at this restaurant
    const { data: customerUsers, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, phone, created_at')
      .eq('role', 'customer')
      .order('full_name', { ascending: true })

    if (userError) throw userError

    // Build customer list with order stats
    const results: any[] = []

    for (const user of customerUsers || []) {
      const { data: userOrders, error: ordError } = await supabaseAdmin
        .from('orders')
        .select('id, status, created_at')
        .eq('customer_id', user.id)
        .eq('restaurant_id', restaurantId)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })

      if (ordError) throw ordError

      const completedOrders = (userOrders || []).filter((o) => o.status === 'completed' || o.status === 'served')

      const orderIds = completedOrders.map((o) => o.id)
      let totalSpent = 0
      if (orderIds.length > 0) {
        const { data: items } = await supabaseAdmin
          .from('order_items')
          .select('unit_price_at_order, quantity')
          .in('order_id', orderIds)
        totalSpent = items?.reduce((s, i) => s + i.unit_price_at_order * i.quantity, 0) || 0
      }

      const matchesSearch = !search ||
        user.full_name?.toLowerCase().includes((search as string).toLowerCase()) ||
        user.phone?.toLowerCase().includes((search as string).toLowerCase())

      if (matchesSearch) {
        results.push({
          id: user.id,
          name: user.full_name,
          phone: user.phone,
          type: 'registered',
          total_orders: (userOrders || []).length,
          total_spent: Math.round(totalSpent * 100) / 100,
          last_visit: userOrders?.[0]?.created_at || null,
          first_visit: userOrders?.[userOrders.length - 1]?.created_at || null,
          is_repeat: (userOrders || []).length >= 2,
          recent_orders: (userOrders || []).slice(0, 5).map((o) => ({
            id: o.id,
            status: o.status,
            date: o.created_at,
          })),
        })
      }
    }

    // Sort by total spent descending
    results.sort((a, b) => b.total_spent - a.total_spent)

    res.json({
      success: true,
      data: {
        customers: results,
        total: results.length,
        total_revenue: results.reduce((s, c) => s + c.total_spent, 0),
        avg_orders_per_customer: results.length > 0
          ? Math.round((results.reduce((s, c) => s + c.total_orders, 0) / results.length) * 10) / 10
          : 0,
        repeat_customers: results.filter((c) => c.is_repeat).length,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
