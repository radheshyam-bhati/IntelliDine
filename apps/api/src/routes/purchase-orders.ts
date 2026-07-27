import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { z } from 'zod'

const router = Router()

const createPOSchema = z.object({
  supplier_id: z.string().uuid(),
  order_number: z.string().max(100).optional(),
  expected_date: z.string().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  items: z.array(z.object({
    ingredient_id: z.string().uuid(),
    quantity_ordered: z.number().positive(),
    unit_cost: z.number().nonnegative(),
  })).min(1, 'At least one item is required'),
})

const receiveSchema = z.object({
  received_date: z.string().optional().default(() => new Date().toISOString()),
  notes: z.string().max(1000).nullable().optional(),
  items: z.array(z.object({
    ingredient_id: z.string().uuid(),
    quantity_received: z.number().positive(),
    batch_number: z.string().max(100).nullable().optional(),
    expiry_date: z.string().nullable().optional(),
    unit_cost: z.number().nonnegative().nullable().optional(),
  })).min(1, 'At least one item is required'),
})

// GET /api/purchase-orders — list all POs
router.get('/', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { status, supplier_id } = req.query
    let query = supabaseAdmin
      .from('purchase_orders')
      .select('*, suppliers(name), purchase_order_items(*)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (status && typeof status === 'string') query = query.eq('status', status)
    if (supplier_id && typeof supplier_id === 'string') query = query.eq('supplier_id', supplier_id)

    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) { next(err) }
})

// GET /api/purchase-orders/:id — single PO
router.get('/:id', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .select('*, suppliers(name), purchase_order_items(*)')
      .eq('id', id)
      .single()
    if (error || !data) throw new NotFoundError('Purchase order not found')
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

// POST /api/purchase-orders — create PO
router.post('/', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const body = createPOSchema.parse(req.body)
    const orderNumber = body.order_number || `PO-${Date.now().toString(36).toUpperCase()}`

    const subtotal = body.items.reduce((sum, item) => sum + item.quantity_ordered * item.unit_cost, 0)

    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .insert({
        restaurant_id: restaurantId,
        supplier_id: body.supplier_id,
        order_number: orderNumber,
        status: 'draft',
        expected_date: body.expected_date || null,
        subtotal,
        tax_amount: 0,
        shipping_cost: 0,
        total_amount: subtotal,
        notes: body.notes || null,
        created_by_user_id: req.user!.id,
      })
      .select()
      .single()
    if (poError) throw poError

    const poItems = body.items.map(item => ({
      purchase_order_id: po.id,
      ingredient_id: item.ingredient_id,
      quantity_ordered: item.quantity_ordered,
      quantity_received: 0,
      unit_cost: item.unit_cost,
      total_cost: item.quantity_ordered * item.unit_cost,
    }))

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('purchase_order_items')
      .insert(poItems)
      .select()
    if (itemsError) throw itemsError

    res.status(201).json({ success: true, data: { ...po, purchase_order_items: items } })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

// PUT /api/purchase-orders/:id — update PO status
router.put('/:id', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const schema = z.object({ status: z.enum(['draft', 'sent', 'confirmed', 'received', 'cancelled']) })
    const body = schema.parse(req.body)

    const { data: existing } = await supabaseAdmin.from('purchase_orders').select('id, status').eq('id', id).single()
    if (!existing) throw new NotFoundError('Purchase order not found')

    const updateData: any = { status: body.status }
    if (body.status === 'sent') updateData.order_date = new Date().toISOString()
    if (body.status === 'received') updateData.received_date = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

// POST /api/purchase-orders/:id/receive — receive items
router.post('/:id/receive', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const body = receiveSchema.parse(req.body)

    const { data: po } = await supabaseAdmin
      .from('purchase_orders')
      .select('*, purchase_order_items(*)')
      .eq('id', id)
      .single()
    if (!po) throw new NotFoundError('Purchase order not found')

    // Create receiving note
    const { data: note, error: noteError } = await supabaseAdmin
      .from('receiving_notes')
      .insert({
        restaurant_id: po.restaurant_id,
        purchase_order_id: id,
        received_date: body.received_date || new Date().toISOString(),
        notes: body.notes || null,
        created_by_user_id: req.user!.id,
      })
      .select()
      .single()
    if (noteError) throw noteError

    // Create receiving note items and update inventory
    for (const item of body.items) {
      let batchId: string | null = null
      if (item.batch_number) {
        const { data: batch } = await supabaseAdmin
          .from('batches')
          .insert({
            ingredient_id: item.ingredient_id,
            batch_number: item.batch_number,
            quantity: item.quantity_received,
            received_date: new Date().toISOString(),
            expiry_date: item.expiry_date || null,
          })
          .select()
          .single()
        if (batch) batchId = batch.id
      }

      await supabaseAdmin
        .from('receiving_note_items')
        .insert({
          receiving_note_id: note.id,
          ingredient_id: item.ingredient_id,
          batch_id: batchId,
          quantity_received: item.quantity_received,
          unit_cost: item.unit_cost,
        })

      // Update ingredient stock
      const { data: ing } = await supabaseAdmin
        .from('ingredients')
        .select('current_stock')
        .eq('id', item.ingredient_id)
        .single()
      if (ing) {
        await supabaseAdmin
          .from('ingredients')
          .update({ current_stock: ing.current_stock + item.quantity_received })
          .eq('id', item.ingredient_id)

        // Record inventory adjustment
        await supabaseAdmin.from('inventory_adjustments').insert({
          ingredient_id: item.ingredient_id,
          change_amount: item.quantity_received,
          stock_after: ing.current_stock + item.quantity_received,
          reason: 'manual_restock',
          reference_id: note.id,
          created_by_user_id: req.user!.id,
        })

        // Update purchase order item received qty
        const poItem = po.purchase_order_items?.find((pi: any) => pi.ingredient_id === item.ingredient_id)
        if (poItem) {
          await supabaseAdmin
            .from('purchase_order_items')
            .update({ quantity_received: (poItem.quantity_received || 0) + item.quantity_received })
            .eq('id', poItem.id)
        }
      }
    }

    // Mark PO as received
    await supabaseAdmin
      .from('purchase_orders')
      .update({ status: 'received', received_date: new Date().toISOString() })
      .eq('id', id)

    const { data: updated } = await supabaseAdmin
      .from('purchase_orders')
      .select('*, purchase_order_items(*)')
      .eq('id', id)
      .single()

    res.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

export default router
