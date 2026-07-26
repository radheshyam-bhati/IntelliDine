import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createOrderSchema, updateOrderStatusSchema, modifyOrderItemsSchema, updateSpecialRequestSchema } from '../lib/validation.js'
import { ValidationError, NotFoundError } from '../lib/errors.js'
import { processOrderDeduction } from '../services/cascade.js'
import { z } from 'zod'

const router = Router()

router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createOrderSchema.parse(req.body)

    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from('menu_items')
      .select('id, price, is_available, restaurant_id')
      .in('id', body.items.map((i) => i.menu_item_id))
      .eq('restaurant_id', body.restaurant_id)

    if (menuError) throw menuError

    if (!menuItems || menuItems.length !== body.items.length) {
      const foundIds = new Set(menuItems?.map((m) => m.id) || [])
      const missingIds = body.items
        .filter((i) => !foundIds.has(i.menu_item_id))
        .map((i) => i.menu_item_id)
      throw new ValidationError(`Menu items not found: ${missingIds.join(', ')}`)
    }

    const unavailableItems = menuItems.filter((m) => !m.is_available)
    if (unavailableItems.length > 0) {
      throw new ValidationError(
        `Items are no longer available: ${unavailableItems.map((m) => m.id).join(', ')}`,
        { unavailable_item_ids: unavailableItems.map((m) => m.id) },
      )
    }

    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]))

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        restaurant_id: body.restaurant_id,
        table_id: body.table_id,
        customer_id: body.customer_id ?? req.user?.id ?? null,
        created_by_user_id: req.user?.id ?? null,
        status: 'placed',
      })
      .select()
      .single()

    if (orderError) throw orderError

    const orderItems = body.items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price_at_order: priceMap.get(item.menu_item_id) || 0,
      special_request: item.special_request ?? null,
    }))

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)
      .select()

    if (itemsError) throw itemsError

    const { error: tableError } = await supabaseAdmin
      .from('tables')
      .update({ status: 'ordered' })
      .eq('id', body.table_id)

    if (tableError) {
      console.error(`[ORDERS] Failed to update table ${body.table_id} status`, tableError)
    }

    await processOrderDeduction(order.id, supabaseAdmin, req.app.get('io'))

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${body.restaurant_id}:kitchen`).emit('order:created', { ...order, items })
      io.to(`restaurant:${body.restaurant_id}:staff`).emit('order:created', { ...order, items })
    }

    res.status(201).json({ success: true, data: { ...order, items } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

router.get('/:restaurantId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params
    const { status, date_from, date_to } = req.query

    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (status && typeof status === 'string') {
      query = query.eq('status', status)
    }

    if (date_from && typeof date_from === 'string') {
      query = query.gte('created_at', date_from)
    }

    if (date_to && typeof date_to === 'string') {
      query = query.lte('created_at', date_to)
    }

    const { data: orders, error } = await query

    if (error) throw error

    res.json({ success: true, data: orders || [] })
  } catch (err) {
    next(err)
  }
})

router.get('/detail/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single()

    if (error || !order) {
      throw new NotFoundError('Order not found')
    }

    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

router.put('/:id/status', authenticate, requireRole('kitchen', 'server', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const body = updateOrderStatusSchema.parse(req.body)

    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single()

    if (fetchError || !order) {
      throw new NotFoundError('Order not found')
    }

    const { data: updated, error } = await supabaseAdmin
      .from('orders')
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (body.status === 'served' || body.status === 'completed') {
      const { data: tableOrders, error: tableError } = await supabaseAdmin
        .from('orders')
        .select('status')
        .eq('table_id', order.table_id)
        .eq('restaurant_id', order.restaurant_id)
        .neq('status', 'cancelled')

      if (!tableError && tableOrders) {
        const allServedOrCompleted = tableOrders.every(
          (o) => o.status === 'served' || o.status === 'completed',
        )
        if (allServedOrCompleted) {
          await supabaseAdmin
            .from('tables')
            .update({ status: 'needs_bill' })
            .eq('id', order.table_id)
        }
      }
    }

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${order.restaurant_id}:staff`).emit('order:updated', updated)
      io.to(`restaurant:${order.restaurant_id}:kitchen`).emit('order:updated', updated)
      if (order.customer_id) {
        io.to(`user:${order.customer_id}`).emit('order:updated', updated)
      }
    }

    res.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

router.patch('/:id/items', authenticate, requireRole('server', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const body = modifyOrderItemsSchema.parse(req.body)

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, restaurant_id, customer_id, status')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      throw new NotFoundError('Order not found')
    }

    if (order.status !== 'placed' && order.status !== 'received') {
      throw new ValidationError('Cannot modify items on an order that is already being prepared or served')
    }

    const menuItemIds = body.items.map((i) => i.menu_item_id)
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from('menu_items')
      .select('id, price, is_available')
      .in('id', menuItemIds)

    if (menuError) throw menuError

    if (!menuItems || menuItems.length !== menuItemIds.length) {
      const foundIds = new Set(menuItems?.map((m) => m.id) || [])
      const missingIds = menuItemIds.filter((id) => !foundIds.has(id))
      throw new ValidationError(`Menu items not found: ${missingIds.join(', ')}`)
    }

    const unavailableItems = menuItems.filter((m) => !m.is_available)
    if (unavailableItems.length > 0) {
      throw new ValidationError(
        `Items are no longer available: ${unavailableItems.map((m) => m.id).join(', ')}`,
        { unavailable_item_ids: unavailableItems.map((m) => m.id) },
      )
    }

    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]))

    const orderItems = body.items.map((item) => ({
      order_id: id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price_at_order: priceMap.get(item.menu_item_id) || 0,
      special_request: item.special_request ?? null,
    }))

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)
      .select()

    if (itemsError) throw itemsError

    await processOrderDeduction(id, supabaseAdmin, req.app.get('io'))

    const io = req.app.get('io')
    if (io) {
      const { data: updatedOrder } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single()

      if (updatedOrder) {
        io.to(`restaurant:${order.restaurant_id}:staff`).emit('order:updated', updatedOrder)
        io.to(`restaurant:${order.restaurant_id}:kitchen`).emit('order:updated', updatedOrder)
        if (updatedOrder.customer_id) {
          io.to(`user:${updatedOrder.customer_id}`).emit('order:updated', updatedOrder)
        }
      }
    }

    res.json({ success: true, data: items })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

router.delete('/:id/items/:itemId', authenticate, requireRole('server', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, itemId } = req.params

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, restaurant_id, customer_id, status')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      throw new NotFoundError('Order not found')
    }

    if (order.status !== 'placed' && order.status !== 'received') {
      throw new ValidationError('Cannot remove items from an order that is already being prepared or served')
    }

    const { data: orderItem, error: itemError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('id', itemId)
      .eq('order_id', id)
      .single()

    if (itemError || !orderItem) {
      throw new NotFoundError('Order item not found')
    }

    const { data: links, error: linkError } = await supabaseAdmin
      .from('menu_item_ingredients')
      .select('*')
      .eq('menu_item_id', orderItem.menu_item_id)

    if (!linkError && links && links.length > 0) {
      for (const link of links) {
        const returnAmount = link.quantity_required * orderItem.quantity
        if (returnAmount === 0) continue

        const { error: adjError } = await supabaseAdmin.from('inventory_adjustments').insert({
          ingredient_id: link.ingredient_id,
          change_amount: returnAmount,
          reason: 'item_removed',
          order_id: id,
        })

        if (adjError) {
          console.error(`[ORDERS] Failed to record inventory adjustment for ingredient ${link.ingredient_id}`, adjError)
        }
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('id', itemId)

    if (deleteError) throw deleteError

    const io = req.app.get('io')
    if (io) {
      const { data: updatedOrder } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single()

      if (updatedOrder) {
        io.to(`restaurant:${order.restaurant_id}:staff`).emit('order:updated', updatedOrder)
        io.to(`restaurant:${order.restaurant_id}:kitchen`).emit('order:updated', updatedOrder)
        if (updatedOrder.customer_id) {
          io.to(`user:${updatedOrder.customer_id}`).emit('order:updated', updatedOrder)
        }
      }
    }

    res.json({ success: true, data: { message: 'Item removed from order' } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

router.patch('/:id/special-requests', authenticate, requireRole('server', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const body = updateSpecialRequestSchema.parse(req.body)

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, restaurant_id, customer_id')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      throw new NotFoundError('Order not found')
    }

    const { data: orderItem, error: itemError } = await supabaseAdmin
      .from('order_items')
      .select('id')
      .eq('id', body.item_id)
      .eq('order_id', id)
      .single()

    if (itemError || !orderItem) {
      throw new NotFoundError('Order item not found in this order')
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('order_items')
      .update({ special_request: body.special_request })
      .eq('id', body.item_id)
      .select()
      .single()

    if (updateError) throw updateError

    const io = req.app.get('io')
    if (io) {
      const { data: updatedOrder } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single()

      if (updatedOrder) {
        io.to(`restaurant:${order.restaurant_id}:staff`).emit('order:updated', updatedOrder)
        io.to(`restaurant:${order.restaurant_id}:kitchen`).emit('order:updated', updatedOrder)
        if (order.customer_id) {
          io.to(`user:${order.customer_id}`).emit('order:updated', updatedOrder)
        }
      }
    }

    res.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

export default router
