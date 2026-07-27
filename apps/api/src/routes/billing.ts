import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { updatePaymentStatusSchema } from '../lib/validation.js'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { z } from 'zod'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const router = Router()

const generateBillSchema = z.object({
  restaurant_id: z.string().uuid('Restaurant ID must be a valid UUID'),
  table_id: z.string().uuid('Table ID must be a valid UUID'),
  include_service_charge: z.boolean().optional().default(true),
})

router.post('/generate', authenticate, requireRole('server', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = generateBillSchema.parse(req.body)

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('table_id', body.table_id)
      .eq('restaurant_id', body.restaurant_id)
      .in('status', ['completed', 'served'])

    if (ordersError) throw ordersError
    if (!orders || orders.length === 0) {
      throw new ValidationError('No completed or served orders found for this table')
    }

    const { data: restaurant, error: restError } = await supabaseAdmin
      .from('restaurants')
      .select('tax_rate, service_charge_rate')
      .eq('id', body.restaurant_id)
      .single()

    if (restError || !restaurant) {
      throw new ValidationError('Restaurant not found')
    }

    let subtotal = 0
    for (const order of orders) {
      for (const item of order.order_items || []) {
        subtotal += item.quantity * item.unit_price_at_order
      }
    }

    subtotal = Math.round(subtotal * 100) / 100

    const taxRate = restaurant.tax_rate || 0
    const serviceChargeRate = body.include_service_charge ? (restaurant.service_charge_rate || 0) : 0

    const taxAmount = Math.round(subtotal * taxRate * 100) / 100
    const serviceCharge = Math.round(subtotal * serviceChargeRate * 100) / 100
    const total = Math.round((subtotal + taxAmount + serviceCharge) * 100) / 100

    const orderIds = orders.map((o) => o.id)

    const { data: bill, error: billError } = await supabaseAdmin
      .from('bills')
      .insert({
        restaurant_id: body.restaurant_id,
        table_id: body.table_id,
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
      io.to(`restaurant:${body.restaurant_id}:staff`).emit('notification', {
        type: 'bill_generated',
        message: `Bill #${bill.id.slice(0, 8)} generated for table`,
        data: bill,
      })
    }

    res.status(201).json({ success: true, data: bill })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

router.get('/:billId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { billId } = req.params

    const { data: bill, error } = await supabaseAdmin
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single()

    if (error || !bill) {
      throw new NotFoundError('Bill not found')
    }

    const orderIds: string[] = bill.order_ids || []

    let orderItems: unknown[] = []
    if (orderIds.length > 0) {
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('*, orders!inner(restaurant_id, table_id, status)')
        .in('order_id', orderIds)

      if (items) {
        orderItems = items
      }
    }

    res.json({ success: true, data: { ...bill, order_items: orderItems } })
  } catch (err) {
    next(err)
  }
})

router.put('/:billId/payment', authenticate, requireRole('server', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { billId } = req.params
    const body = updatePaymentStatusSchema.parse(req.body)

    const { data: bill, error: fetchError } = await supabaseAdmin
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single()

    if (fetchError || !bill) {
      throw new NotFoundError('Bill not found')
    }

    const { data: updated, error } = await supabaseAdmin
      .from('bills')
      .update({
        payment_status: body.payment_status,
        payment_reference: body.payment_reference ?? null,
      })
      .eq('id', billId)
      .select()
      .single()

    if (error) throw error

    if (body.payment_status === 'paid') {
      await supabaseAdmin
        .from('tables')
        .update({ status: 'needs_cleaning' })
        .eq('id', bill.table_id)
    }

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${bill.restaurant_id}:staff`).emit('notification', {
        type: 'payment_updated',
        message: `Payment for bill is now ${body.payment_status}`,
        data: updated,
      })
    }

    res.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

router.post('/:billId/stripe-intent', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { billId } = req.params

    const { data: bill, error: fetchError } = await supabaseAdmin
      .from('bills')
      .select('*, restaurants(name)')
      .eq('id', billId)
      .single()

    if (fetchError || !bill) {
      throw new NotFoundError('Bill not found')
    }

    if (bill.payment_status === 'paid') {
      throw new ValidationError('Bill is already paid')
    }

    const amountInCents = Math.round(bill.total * 100)

    if (stripe) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: { bill_id: bill.id, restaurant_id: bill.restaurant_id },
      })
      res.json({ success: true, data: { client_secret: paymentIntent.client_secret, amount: amountInCents } })
    } else {
      res.json({
        success: true,
        data: {
          client_secret: 'pi_mock_secret_for_local_dev',
          amount: amountInCents,
          mock: true
        }
      })
    }
  } catch (err) {
    next(err)
  }
})

const splitEvenlySchema = z.object({
  num_splits: z.number().int().positive('Number of splits must be positive').min(2, 'At least 2 splits required'),
})

const splitByItemsSchema = z.object({
  splits: z.array(z.object({
    label: z.string().min(1).max(100).default('Split'),
    item_ids: z.array(z.string()).min(1, 'Each split must have at least one item'),
  })).min(2, 'At least 2 splits required'),
})

router.post('/:billId/split-evenly', authenticate, requireRole('server', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { billId } = req.params
    const body = splitEvenlySchema.parse(req.body)

    const { data: bill, error: fetchError } = await supabaseAdmin
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single()

    if (fetchError || !bill) {
      throw new NotFoundError('Bill not found')
    }

    // Round down each split, last split gets the remainder
    const splitAmount = Math.floor((bill.total * 100) / body.num_splits) / 100
    const remainder = Math.round((bill.total - splitAmount * body.num_splits) * 100) / 100

    const splits = Array.from({ length: body.num_splits }, (_, i) => ({
      split_index: i,
      label: `Split ${i + 1}`,
      amount: i === body.num_splits - 1
        ? Math.round((splitAmount + remainder) * 100) / 100
        : splitAmount,
      items: [] as string[],
      payment_status: 'unpaid' as const,
    }))

    res.json({ success: true, data: { bill_id: billId, total: bill.total, splits } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

router.post('/:billId/split-by-items', authenticate, requireRole('server', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { billId } = req.params
    const body = splitByItemsSchema.parse(req.body)

    const { data: bill, error: fetchError } = await supabaseAdmin
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single()

    if (fetchError || !bill) {
      throw new NotFoundError('Bill not found')
    }

    const orderIds: string[] = bill.order_ids || []

    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('id, menu_item_id, quantity, unit_price_at_order')
      .in('order_id', orderIds)

    if (itemsError) throw itemsError

    const itemPriceMap = new Map<string, number>()
    for (const oi of orderItems || []) {
      itemPriceMap.set(oi.id, oi.unit_price_at_order * oi.quantity)
    }

    const totalItemValue = orderItems?.reduce((s, oi) => s + oi.unit_price_at_order * oi.quantity, 0) || 0
    const taxRatio = totalItemValue > 0 ? bill.tax_amount / totalItemValue : 0
    const serviceRatio = totalItemValue > 0 ? bill.service_charge_amount / totalItemValue : 0

    // Deduplicate item_ids across splits to ensure no item belongs to multiple splits
    const assignedItemIds = new Set<string>()
    for (const split of body.splits) {
      for (const id of split.item_ids) {
        if (assignedItemIds.has(id)) {
          throw new ValidationError(`Item ${id} is assigned to multiple splits`)
        }
        assignedItemIds.add(id)
      }
    }

    // Verify all assigned items exist on this bill
    for (const id of assignedItemIds) {
      if (!itemPriceMap.has(id)) {
        throw new ValidationError(`Item ${id} not found on this bill`)
      }
    }

    const splits = body.splits.map((split, i) => {
      const itemsTotal = split.item_ids.reduce((s, id) => s + (itemPriceMap.get(id) || 0), 0)
      const splitTax = Math.round(itemsTotal * taxRatio * 100) / 100
      const splitService = Math.round(itemsTotal * serviceRatio * 100) / 100
      const amount = Math.round((itemsTotal + splitTax + splitService) * 100) / 100

      return {
        split_index: i,
        label: split.label,
        amount,
        subtotal: Math.round(itemsTotal * 100) / 100,
        tax_amount: splitTax,
        service_amount: splitService,
        items: split.item_ids,
        payment_status: 'unpaid' as const,
      }
    })

    res.json({ success: true, data: { bill_id: billId, total: bill.total, splits } })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

export default router
