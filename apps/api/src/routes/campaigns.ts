import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { z } from 'zod'

const router = Router()

// ──────────────────────────────
// COUPONS
// ──────────────────────────────

const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  description: z.string().max(500).nullable().optional(),
  discount_type: z.enum(['percentage', 'fixed_amount']),
  discount_value: z.number().positive(),
  minimum_order: z.number().nonnegative().nullable().optional(),
  maximum_discount: z.number().nonnegative().nullable().optional(),
  usage_limit: z.number().int().positive().nullable().optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
})

// GET /api/coupons — list coupons
router.get('/coupons', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) { next(err) }
})

// POST /api/coupons — create coupon
router.post('/coupons', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const body = createCouponSchema.parse(req.body)
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert({ ...body, restaurant_id: restaurantId, used_count: 0, is_active: true })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

// ──────────────────────────────
// CAMPAIGNS
// ──────────────────────────────

const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  type: z.enum(['email', 'sms', 'push', 'whatsapp', 'coupon']),
  content: z.string().max(5000).nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
  target_segment: z.string().max(200).nullable().optional(),
  coupon_id: z.string().uuid().nullable().optional(),
})

const updateCampaignSchema = z.object({
  status: z.enum(['draft', 'scheduled', 'active', 'completed', 'cancelled']).optional(),
  name: z.string().min(1).max(200).optional(),
  content: z.string().max(5000).nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
})

// GET /api/campaigns — list campaigns
router.get('/', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { status } = req.query
    let query = supabaseAdmin
      .from('campaigns')
      .select('*, coupons(*)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (status && typeof status === 'string') query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) { next(err) }
})

// POST /api/campaigns — create campaign
router.post('/', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const body = createCampaignSchema.parse(req.body)
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        restaurant_id: restaurantId,
        name: body.name,
        description: body.description || null,
        type: body.type,
        status: 'draft',
        content: body.content || null,
        scheduled_at: body.scheduled_at || null,
        target_segment: body.target_segment || null,
        coupon_id: body.coupon_id || null,
        stats_sent: 0,
        stats_opened: 0,
        stats_converted: 0,
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

// PUT /api/campaigns/:id — update campaign
router.put('/:id', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const body = updateCampaignSchema.parse(req.body)

    const { data: existing } = await supabaseAdmin.from('campaigns').select('id').eq('id', id).single()
    if (!existing) throw new NotFoundError('Campaign not found')

    const updateData: any = { ...body }
    if (body.status === 'active' && !body.scheduled_at) {
      updateData.sent_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('campaigns')
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

export default router
