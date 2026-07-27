import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { z } from 'zod'

const router = Router()

const createSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  contact_name: z.string().max(200).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  tax_id: z.string().max(100).nullable().optional(),
  payment_terms: z.string().max(200).nullable().optional(),
  lead_time_days: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
})

const updateSupplierSchema = createSupplierSchema.partial()

// GET /api/suppliers — list all suppliers
router.get('/', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { search } = req.query
    let query = supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name', { ascending: true })

    if (search && typeof search === 'string') {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) { next(err) }
})

// GET /api/suppliers/:id — single supplier
router.get('/:id', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) throw new NotFoundError('Supplier not found')
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

// POST /api/suppliers — create supplier
router.post('/', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const body = createSupplierSchema.parse(req.body)
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .insert({ ...body, restaurant_id: restaurantId })
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

// PUT /api/suppliers/:id — update supplier
router.put('/:id', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const body = updateSupplierSchema.parse(req.body)

    const { data: existing } = await supabaseAdmin.from('suppliers').select('id').eq('id', id).single()
    if (!existing) throw new NotFoundError('Supplier not found')

    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .update(body)
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

// DELETE /api/suppliers/:id — delete supplier
router.delete('/:id', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { data: existing } = await supabaseAdmin.from('suppliers').select('id').eq('id', id).single()
    if (!existing) throw new NotFoundError('Supplier not found')

    const { error } = await supabaseAdmin.from('suppliers').delete().eq('id', id)
    if (error) throw error
    res.json({ success: true, data: { message: 'Supplier deleted' } })
  } catch (err) { next(err) }
})

export default router
