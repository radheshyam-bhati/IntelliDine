import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { recalculateAvailability } from '../services/cascade.js'
import { sendNotification } from '../services/notifications.js'
import { z } from 'zod'

const router = Router()

router.get('/menu-categories', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { data: categories, error } = await supabaseAdmin
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('display_order', { ascending: true })

    if (error) throw error
    res.json({ success: true, data: categories || [] })
  } catch (err) { next(err) }
})

router.get('/menu-items', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { data: items, error } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name', { ascending: true })

    if (error) throw error
    res.json({ success: true, data: items || [] })
  } catch (err) { next(err) }
})

const createCategorySchema = z.object({
  name: z.string().min(1).max(200),
  display_order: z.number().int().nonnegative().optional().default(0),
})

router.post('/menu-categories', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createCategorySchema.parse(req.body)
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { data: category, error } = await supabaseAdmin
      .from('menu_categories')
      .insert({ restaurant_id: restaurantId, name: body.name, display_order: body.display_order })
      .select()
      .single()

    if (error) throw error

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${restaurantId}:staff`).emit('notification', {
        type: 'category_created', message: `Category "${category.name}" created`, data: category,
      })
    }

    res.status(201).json({ success: true, data: category })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

const updateMenuItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().positive().optional(),
  category_id: z.string().uuid().optional(),
  dietary_tags: z.array(z.string()).optional(),
  is_available: z.boolean().optional(),
  is_manual_override: z.boolean().optional(),
})

const createMenuItemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().default(''),
  price: z.number().positive(),
  category_id: z.string().uuid(),
  dietary_tags: z.array(z.string()).optional().default([]),
})

router.post('/menu-items', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createMenuItemSchema.parse(req.body)
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { data: item, error } = await supabaseAdmin
      .from('menu_items')
      .insert({
        restaurant_id: restaurantId,
        category_id: body.category_id,
        name: body.name,
        description: body.description,
        price: body.price,
        dietary_tags: body.dietary_tags,
        is_available: true,
        is_manual_override: false,
      })
      .select()
      .single()

    if (error) throw error

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${restaurantId}:staff`).emit('notification', {
        type: 'menu_item_created', message: `Item "${item.name}" created`, data: item,
      })
    }

    res.status(201).json({ success: true, data: item })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

router.patch('/menu-items/:id', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const body = updateMenuItemSchema.parse(req.body)
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('menu_items')
      .select('id, restaurant_id')
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .single()

    if (fetchError || !existing) throw new NotFoundError('Menu item not found')

    const { data: item, error } = await supabaseAdmin
      .from('menu_items')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${restaurantId}:staff`).emit('notification', {
        type: 'menu_item_updated', message: `Item "${item.name}" updated`, data: item,
      })
    }

    res.json({ success: true, data: item })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

router.delete('/menu-items/:id', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const restaurantId = req.user!.restaurant_id

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('menu_items')
      .select('id')
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .single()

    if (fetchError || !existing) throw new NotFoundError('Menu item not found')

    const { error } = await supabaseAdmin.from('menu_item_ingredients').delete().eq('menu_item_id', id)
    if (error) throw error

    const { error: deleteError } = await supabaseAdmin.from('menu_items').delete().eq('id', id)
    if (deleteError) throw deleteError

    res.json({ success: true, data: { message: 'Item deleted' } })
  } catch (err) { next(err) }
})

router.get('/orders/active', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', restaurantId)
      .not('status', 'in', '("completed","cancelled")')
      .order('created_at', { ascending: false })

    if (error) throw error

    const enriched = await Promise.all((orders || []).map(async (order) => {
      const { data: table } = await supabaseAdmin
        .from('tables')
        .select('label')
        .eq('id', order.table_id)
        .single()

      const itemIds = (order.order_items || []).map((oi: any) => oi.menu_item_id)
      let itemNames: Map<string, string> = new Map()
      if (itemIds.length > 0) {
        const { data: items } = await supabaseAdmin
          .from('menu_items')
          .select('id, name')
          .in('id', itemIds)
        if (items) items.forEach((i) => itemNames.set(i.id, i.name))
      }

      return {
        ...order,
        tableLabel: table?.label || order.table_id.slice(0, 6),
        items: (order.order_items || []).map((oi: any) => ({
          ...oi,
          name: itemNames.get(oi.menu_item_id) || 'Item',
        })),
      }
    }))

    res.json({ success: true, data: enriched })
  } catch (err) { next(err) }
})

router.get('/tables', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { data: tables, error } = await supabaseAdmin
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('label', { ascending: true })

    if (error) throw error
    res.json({ success: true, data: tables || [] })
  } catch (err) { next(err) }
})

router.get('/tables/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const restaurantId = req.user!.restaurant_id

    const { data: table, error } = await supabaseAdmin
      .from('tables')
      .select('*')
      .eq('id', id)
      .eq('restaurant_id', restaurantId)
      .single()

    if (error || !table) throw new NotFoundError('Table not found')
    res.json({ success: true, data: table })
  } catch (err) { next(err) }
})

router.get('/ingredients', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { data: ingredients, error } = await supabaseAdmin
      .from('ingredients')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name', { ascending: true })

    if (error) throw error
    res.json({ success: true, data: ingredients || [] })
  } catch (err) { next(err) }
})

const adjustSchema = z.object({
  ingredientId: z.string().uuid(),
  changeAmount: z.number(),
  reason: z.enum(['order_deduction', 'manual_restock', 'waste_logged', 'correction']).optional().default('manual_restock'),
})

router.post('/inventory/adjust', authenticate, requireRole('manager', 'kitchen'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = adjustSchema.parse(req.body)

    const { data: ingredient, error: fetchError } = await supabaseAdmin
      .from('ingredients')
      .select('*')
      .eq('id', body.ingredientId)
      .single()

    if (fetchError || !ingredient) throw new NotFoundError('Ingredient not found')

    const newStock = Math.max(0, ingredient.current_stock + body.changeAmount)

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('ingredients')
      .update({ current_stock: newStock })
      .eq('id', body.ingredientId)
      .select()
      .single()

    if (updateError) throw updateError

    const { error: adjError } = await supabaseAdmin.from('inventory_adjustments').insert({
      ingredient_id: body.ingredientId,
      change_amount: body.changeAmount,
      reason: body.reason,
      created_by_user_id: req.user?.id ?? null,
    })
    if (adjError) throw adjError

    const io = req.app.get('io')
    await recalculateAvailability(body.ingredientId, supabaseAdmin, io)

    if (io) {
      io.to(`restaurant:${ingredient.restaurant_id}:staff`).emit('ingredient:updated', updated)
    }

    res.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

const createBillSchema = z.object({
  tableId: z.string().uuid(),
  includeServiceCharge: z.boolean().optional().default(true),
})

router.post('/bills', authenticate, requireRole('server', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createBillSchema.parse(req.body)
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { data: restaurant, error: restError } = await supabaseAdmin
      .from('restaurants')
      .select('tax_rate, service_charge_rate')
      .eq('id', restaurantId)
      .single()

    if (restError || !restaurant) throw new ValidationError('Restaurant not found')

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('table_id', body.tableId)
      .eq('restaurant_id', restaurantId)
      .in('status', ['completed', 'served'])

    if (ordersError) throw ordersError
    if (!orders || orders.length === 0) throw new ValidationError('No completed orders for this table')

    let subtotal = 0
    for (const order of orders) {
      for (const item of order.order_items || []) {
        subtotal += item.quantity * item.unit_price_at_order
      }
    }
    subtotal = Math.round(subtotal * 100) / 100

    const taxAmount = Math.round(subtotal * (restaurant.tax_rate || 0) * 100) / 100
    const serviceCharge = body.includeServiceCharge
      ? Math.round(subtotal * (restaurant.service_charge_rate || 0) * 100) / 100
      : 0
    const total = Math.round((subtotal + taxAmount + serviceCharge) * 100) / 100

    const orderIds = orders.map((o) => o.id)

    const { data: bill, error: billError } = await supabaseAdmin
      .from('bills')
      .insert({
        restaurant_id: restaurantId,
        table_id: body.tableId,
        order_ids: orderIds,
        subtotal,
        tax_amount: taxAmount,
        service_charge_amount: serviceCharge,
        total,
        payment_status: 'unpaid',
      })
      .select()
      .single()

    if (billError) throw billError

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${restaurantId}:staff`).emit('notification', {
        type: 'bill_generated',
        message: `Bill generated for table`,
        data: bill,
      })
    }

    res.status(201).json({ success: true, data: bill })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

router.get('/restaurants/:slug/menu', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params

    const { data: restaurant, error: restError } = await supabaseAdmin
      .from('restaurants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (restError || !restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' })
    }

    const { data: categories, error: catError } = await supabaseAdmin
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('display_order', { ascending: true })

    if (catError) throw catError

    const { data: items, error: itemError } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_available', true)
      .order('name', { ascending: true })

    if (itemError) throw itemError

    const grouped = (categories || []).map((cat) => ({
      ...cat,
      items: (items || []).filter((item) => item.category_id === cat.id),
    }))

    res.json({ success: true, data: grouped })
  } catch (err) { next(err) }
})

router.get('/restaurants/:slug/recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params

    const { data: restaurant, error: restError } = await supabaseAdmin
      .from('restaurants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (restError || !restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: topItems, error: topError } = await supabaseAdmin
      .from('order_items')
      .select('menu_item_id, quantity, orders!inner(restaurant_id, created_at)')
      .eq('orders.restaurant_id', restaurant.id)
      .gte('orders.created_at', thirtyDaysAgo.toISOString())

    if (topError) throw topError

    const countMap = new Map<string, number>()
    for (const oi of topItems || []) {
      countMap.set(oi.menu_item_id, (countMap.get(oi.menu_item_id) || 0) + oi.quantity)
    }

    const sortedIds = [...countMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => id)

    if (sortedIds.length === 0) {
      return res.json({ success: true, data: [] })
    }

    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .in('id', sortedIds)
      .eq('is_available', true)

    if (menuError) throw menuError

    const recommendations = sortedIds
      .map((id) => {
        const item = (menuItems || []).find((m) => m.id === id)
        if (!item) return null
        return { ...item, order_count: countMap.get(id) || 0 }
      })
      .filter(Boolean)

    res.json({ success: true, data: recommendations })
  } catch (err) { next(err) }
})

const orderCreateSchema = z.object({
  restaurantSlug: z.string().optional(),
  tableId: z.string().optional(),
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().optional(),
  })).min(1),
})

router.get('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')

    const { data: order, error } = await query.eq('id', id).single()
    if (error || !order) throw new NotFoundError('Order not found')

    res.json({ success: true, data: order })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

router.post('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = orderCreateSchema.parse(req.body)

    let restaurantId = req.user?.restaurant_id
    if (!restaurantId && body.restaurantSlug) {
      const { data: rest } = await supabaseAdmin
        .from('restaurants')
        .select('id')
        .eq('slug', body.restaurantSlug)
        .single()
      if (rest) restaurantId = rest.id
    }

    if (!restaurantId) throw new ValidationError('Could not determine restaurant')

    const menuItemIds = body.items.map((i) => i.menuItemId)
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from('menu_items')
      .select('id, price, is_available, restaurant_id')
      .in('id', menuItemIds)

    if (menuError) throw menuError
    if (!menuItems || menuItems.length !== menuItemIds.length) {
      throw new ValidationError('Some menu items not found')
    }

    const unavailableItems = menuItems.filter((m) => !m.is_available)
    if (unavailableItems.length > 0) {
      throw new ValidationError('Some items are no longer available', {
        unavailable_item_ids: unavailableItems.map((m) => m.id),
      })
    }

    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]))

    const { data: table, error: tableError } = await supabaseAdmin
      .from('tables')
      .select('id')
      .eq('id', body.tableId)
      .eq('restaurant_id', restaurantId)
      .single()

    if (tableError || !table) throw new ValidationError('Table not found')

    const itemsJson = body.items.map((item) => ({
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      unit_price: priceMap.get(item.menuItemId) || item.unitPrice || 0,
    }))

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('create_order_with_inventory', {
      p_restaurant_id: restaurantId,
      p_table_id: body.tableId,
      p_customer_id: req.user?.id ?? null,
      p_created_by_user_id: req.user?.id ?? null,
      p_items: JSON.stringify(itemsJson),
    })

    if (rpcError) {
      console.error('[ORDERS] RPC failed, falling back to sequential creation', rpcError)

      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          restaurant_id: restaurantId,
          table_id: body.tableId,
          customer_id: req.user?.id ?? null,
          created_by_user_id: req.user?.id ?? null,
          status: 'placed',
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItemsData = body.items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price_at_order: priceMap.get(item.menuItemId) || item.unitPrice || 0,
      }))

      const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItemsData)
        .select()

      if (itemsError) throw itemsError

      await supabaseAdmin.from('tables').update({ status: 'ordered' }).eq('id', body.tableId)

      const { processOrderDeduction } = await import('../services/cascade.js')
      const io = req.app.get('io')
      await processOrderDeduction(order.id, supabaseAdmin, io)

      if (io) {
        io.to(`restaurant:${restaurantId}:kitchen`).emit('order:created', { ...order, items })
        io.to(`restaurant:${restaurantId}:staff`).emit('order:created', { ...order, items })
      }

      return res.status(201).json({ success: true, data: { ...order, items } })
    }

    const orderId = rpcResult?.order_id
    if (!orderId) throw new Error('Order creation returned no ID')

    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) throw new Error('Failed to fetch created order')

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${restaurantId}:kitchen`).emit('order:created', order)
      io.to(`restaurant:${restaurantId}:staff`).emit('order:created', order)
    }

    res.status(201).json({ success: true, data: order })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

const reserveCreateSchema = z.object({
  restaurantSlug: z.string(),
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().min(1).max(20),
  partySize: z.number().int().positive(),
  reservedFor: z.string().min(1),
})

router.post('/reservations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = reserveCreateSchema.parse(req.body)

    const { data: restaurant, error: restError } = await supabaseAdmin
      .from('restaurants')
      .select('id')
      .eq('slug', body.restaurantSlug)
      .single()

    if (restError || !restaurant) throw new ValidationError('Restaurant not found')

    const { data: reservation, error } = await supabaseAdmin
      .from('reservations')
      .insert({
        restaurant_id: restaurant.id,
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        party_size: body.partySize,
        reserved_for: body.reservedFor,
        status: 'confirmed',
      })
      .select()
      .single()

    if (error) throw error

    await sendNotification('reservation_reminder', { type: 'phone', phone: body.customerPhone }, {
      title: 'Reservation Confirmed',
      message: `Your reservation for ${body.partySize} on ${body.reservedFor} is confirmed.`,
    })

    res.status(201).json({ success: true, data: reservation })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

const orderStatusSchema = z.object({
  status: z.enum(['placed', 'received', 'cooking', 'ready', 'served', 'completed', 'cancelled']),
})

router.patch('/orders/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const body = orderStatusSchema.parse(req.body)

    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !order) throw new NotFoundError('Order not found')

    const { data: updated, error } = await supabaseAdmin
      .from('orders')
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (body.status === 'served' || body.status === 'completed') {
      const { data: tableOrders } = await supabaseAdmin
        .from('orders')
        .select('status')
        .eq('table_id', order.table_id)
        .neq('status', 'cancelled')

      const allDone = (tableOrders || []).every((o) => o.status === 'served' || o.status === 'completed')
      if (allDone) {
        await supabaseAdmin.from('tables').update({ status: 'needs_bill' }).eq('id', order.table_id)
      }
    }

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${order.restaurant_id}:staff`).emit('order:updated', updated)
      io.to(`restaurant:${order.restaurant_id}:kitchen`).emit('order:updated', updated)
      if (order.customer_id) io.to(`user:${order.customer_id}`).emit('order:updated', updated)
    }

    res.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

router.get('/inventory/low-stock/predictions', authenticate, requireRole('manager', 'server'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id

    const { data: ingredients, error: ingError } = await supabaseAdmin
      .from('ingredients')
      .select('*')
      .eq('restaurant_id', restaurantId)

    if (ingError) throw ingError

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: adjustments, error: adjError } = await supabaseAdmin
      .from('inventory_adjustments')
      .select('ingredient_id, change_amount, created_at')
      .eq('reason', 'order_deduction')
      .gte('created_at', sevenDaysAgo.toISOString())

    if (adjError) throw adjError

    const consumptionMap = new Map<string, number>()
    for (const adj of adjustments || []) {
      const val = Math.abs(adj.change_amount)
      consumptionMap.set(adj.ingredient_id, (consumptionMap.get(adj.ingredient_id) || 0) + val)
    }

    const predictions = ingredients.map((ing) => {
      const weeklyConsumption = consumptionMap.get(ing.id) || 0
      const dailyRate = weeklyConsumption / 7
      const daysRemaining = dailyRate > 0 ? Math.floor(ing.current_stock / dailyRate) : null
      return {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        current_stock: ing.current_stock,
        reorder_threshold: ing.reorder_threshold,
        weekly_consumption: weeklyConsumption,
        daily_usage_rate: Math.round(dailyRate * 100) / 100,
        days_remaining: daysRemaining,
        predicted_runout_date: daysRemaining !== null ? new Date(Date.now() + daysRemaining * 86400000).toISOString().slice(0, 10) : null,
        status: daysRemaining === null ? 'no_usage_data'
          : ing.current_stock <= ing.reorder_threshold ? 'below_threshold'
          : daysRemaining <= 3 ? 'critical'
          : daysRemaining <= 7 ? 'warning'
          : 'ok',
        below_threshold: ing.current_stock <= ing.reorder_threshold,
      }
    })

    predictions.sort((a, b) => {
      const order = { critical: 0, below_threshold: 1, warning: 2, no_usage_data: 3, ok: 4 }
      return (order[a.status] ?? 99) - (order[b.status] ?? 99)
    })

    res.json({ success: true, data: predictions })
  } catch (err) {
    next(err)
  }
})

const publicQueueSchema = z.object({
  slug: z.string(),
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().min(1).max(20),
  partySize: z.number().int().positive(),
})

router.post('/queue/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = publicQueueSchema.parse(req.body)

    const { data: restaurant, error: restError } = await supabaseAdmin
      .from('restaurants')
      .select('id')
      .eq('slug', body.slug)
      .single()

    if (restError || !restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' })
    }

    const { data: waitingEntries, error: countError } = await supabaseAdmin
      .from('queue_entries')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'waiting')

    if (countError) throw countError

    const AVG_WAIT_MINUTES_PER_PARTY = 25
    const waitingCount = waitingEntries?.length || 0
    const estimatedWaitMinutes = (waitingCount + 1) * AVG_WAIT_MINUTES_PER_PARTY

    const { data: entry, error } = await supabaseAdmin
      .from('queue_entries')
      .insert({
        restaurant_id: restaurant.id,
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        party_size: body.partySize,
        status: 'waiting',
      })
      .select()
      .single()

    if (error) throw error

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${restaurant.id}:staff`).emit('queue:updated', entry)
    }

    const currentPosition = (waitingEntries?.length || 0) + 1

    res.status(201).json({
      success: true,
      data: {
        ...entry,
        position: currentPosition,
        total_ahead: waitingEntries?.length || 0,
        estimated_wait_minutes: estimatedWaitMinutes,
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

router.get('/queue/entry/:entryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entryId } = req.params

    const { data: entry, error } = await supabaseAdmin
      .from('queue_entries')
      .select('*, restaurants!inner(id)')
      .eq('id', entryId)
      .single()

    if (error || !entry) {
      return res.status(404).json({ success: false, error: 'Queue entry not found' })
    }

    res.json({ success: true, data: entry })
  } catch (err) { next(err) }
})

router.get('/queue/:slug/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params

    const { data: restaurant, error: restError } = await supabaseAdmin
      .from('restaurants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (restError || !restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' })
    }

    const { count, error: countError } = await supabaseAdmin
      .from('queue_entries')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'waiting')

    if (countError) throw countError

    res.json({
      success: true,
      data: {
        parties_ahead: count || 0,
        estimated_wait_minutes: ((count || 0) + 1) * 25,
      },
    })
  } catch (err) { next(err) }
})

const flagLowSchema = z.object({
  ingredientId: z.string().uuid(),
})

router.post('/inventory/flag-low', authenticate, requireRole('kitchen', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = flagLowSchema.parse(req.body)

    const { data: ingredient, error: fetchError } = await supabaseAdmin
      .from('ingredients')
      .select('*')
      .eq('id', body.ingredientId)
      .single()

    if (fetchError || !ingredient) throw new NotFoundError('Ingredient not found')

    const changeAmount = ingredient.reorder_threshold - ingredient.current_stock
    if (changeAmount <= 0) {
      return res.json({ success: true, data: ingredient, note: 'Already at or below threshold' })
    }

    const newStock = ingredient.current_stock + changeAmount

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('ingredients')
      .update({ current_stock: newStock })
      .eq('id', body.ingredientId)
      .select()
      .single()

    if (updateError) throw updateError

    await supabaseAdmin.from('inventory_adjustments').insert({
      ingredient_id: body.ingredientId,
      change_amount: changeAmount,
      reason: 'correction',
      note: 'Flagged low by kitchen',
      created_by_user_id: req.user?.id ?? null,
    })

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${ingredient.restaurant_id}:staff`).emit('ingredient:updated', updated)
    }

    res.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

export default router
