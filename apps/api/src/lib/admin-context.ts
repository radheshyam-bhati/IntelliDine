import type { SupabaseClient } from '@supabase/supabase-js'

export interface RestaurantContext {
  todayRevenue: number
  todayOrderCount: number
  topSellers: { name: string; quantity: number }[]
  bottomSellers: { name: string; quantity: number }[]
  lowStockIngredients: { name: string; current_stock: number; threshold: number }[]
  avgTableTurnoverMinutes: number
  busiestDay: string
  totalStaff: number
  tablesOccupied: number
  tablesTotal: number
}

export async function gatherRestaurantContext(
  supabase: any,
  restaurantId: string,
): Promise<RestaurantContext> {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const weekStart = monday.toISOString()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayStartStr = todayStart.toISOString()

  const [{ data: todayOrders }, { data: weekOrders }, { data: ingredients }, { data: completedOrders }, { data: staff }, { data: tables }] =
    await Promise.all([
      supabase.from('orders').select('id').eq('restaurant_id', restaurantId).gte('created_at', todayStartStr),
      supabase.from('orders').select('id, created_at').eq('restaurant_id', restaurantId).gte('created_at', weekStart),
      supabase.from('ingredients').select('name, current_stock, reorder_threshold').eq('restaurant_id', restaurantId),
      supabase
        .from('orders')
        .select('created_at, updated_at')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'completed')
        .gte('created_at', weekStart),
      supabase.from('users').select('id').eq('restaurant_id', restaurantId).neq('role', 'customer'),
      supabase.from('tables').select('status').eq('restaurant_id', restaurantId),
    ])

  const todayOrderCount = todayOrders?.length || 0

  let todayRevenue = 0
  if (todayOrders && todayOrders.length > 0) {
    const todayIds = todayOrders.map((o: any) => o.id)
    const { data: todayItems } = await supabase
      .from('order_items')
      .select('unit_price_at_order, quantity')
      .in('order_id', todayIds)
    todayRevenue = todayItems?.reduce((s: any, i: any) => s + i.unit_price_at_order * i.quantity, 0) || 0
  }

  const weekIds = weekOrders?.map((o: any) => o.id) || []
  let topSellers: { name: string; quantity: number }[] = []
  let bottomSellers: { name: string; quantity: number }[] = []

  if (weekIds.length > 0) {
    const { data: weekItems } = await supabase
      .from('order_items')
      .select('menu_item_id, quantity')
      .in('order_id', weekIds)

    if (weekItems && weekItems.length > 0) {
      const qtyMap = new Map<string, number>()
      weekItems.forEach((i: any) => qtyMap.set(i.menu_item_id, (qtyMap.get(i.menu_item_id) || 0) + i.quantity))

      const menuItemIds = Array.from(qtyMap.keys())
      const { data: menuItems } = await supabase.from('menu_items').select('id, name').in('id', menuItemIds)
      const nameMap = new Map(menuItems?.map((m: any) => [m.id, m.name]) || [])

      const sorted = Array.from(qtyMap.entries())
        .map(([id, qty]) => ({ name: String(nameMap.get(id) || 'Unknown'), quantity: qty }))
        .sort((a, b) => b.quantity - a.quantity)

      topSellers = sorted.slice(0, 5)
      bottomSellers = sorted.slice(-5).reverse()
    }
  }

  const lowStockIngredients = (ingredients || [])
    .filter((i: any) => i.current_stock <= i.reorder_threshold)
    .map((i: any) => ({ name: String(i.name), current_stock: Number(i.current_stock), threshold: Number(i.reorder_threshold) }))

  let avgTableTurnoverMinutes = 0
  if (completedOrders && completedOrders.length > 0) {
    const totalMs = completedOrders.reduce((sum: any, o: any) => {
      return sum + (new Date(o.updated_at).getTime() - new Date(o.created_at).getTime())
    }, 0)
    avgTableTurnoverMinutes = Math.round(totalMs / completedOrders.length / 60000)
  }

  const dayCounts = new Map<string, number>()
  weekOrders?.forEach((o: any) => {
    const day = new Date(o.created_at).toLocaleDateString('en-US', { weekday: 'long' })
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1)
  })
  let busiestDay = 'N/A'
  let maxCount = 0
  for (const [day, count] of dayCounts) {
    if (count > maxCount) {
      maxCount = count
      busiestDay = day
    }
  }

  const totalStaff = staff?.length || 0
  const tablesTotal = tables?.length || 0
  const tablesOccupied = tables?.filter((t: any) => t.status === 'seated' || t.status === 'ordered').length || 0

  return {
    todayRevenue,
    todayOrderCount,
    topSellers,
    bottomSellers,
    lowStockIngredients,
    avgTableTurnoverMinutes,
    busiestDay,
    totalStaff,
    tablesOccupied,
    tablesTotal,
  }
}
