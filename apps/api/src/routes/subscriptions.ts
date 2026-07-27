import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { z } from 'zod'

const router = Router()

const createPlanSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  price: z.number().nonnegative(),
  interval: z.enum(['monthly', 'yearly']),
  max_branches: z.number().int().nonnegative().default(1),
  max_staff: z.number().int().nonnegative().default(10),
  max_menu_items: z.number().int().nonnegative().default(50),
  features: z.array(z.string()).default([]),
})

// GET /api/subscriptions/plans — list all plans
router.get('/plans', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id

    // Show global plans + restaurant-specific plans
    let query = supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .or(`restaurant_id.is.null,restaurant_id.eq.${restaurantId}`)
      .eq('is_active', true)
      .order('price', { ascending: true })

    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) { next(err) }
})

// POST /api/subscriptions/plans — create custom plan
router.post('/plans', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const body = createPlanSchema.parse(req.body)
    const { data, error } = await supabaseAdmin
      .from('subscription_plans')
      .insert({ ...body, restaurant_id: restaurantId, is_active: true })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

// GET /api/subscriptions/active — get active subscription
router.get('/active', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { data, error } = await supabaseAdmin
      .from('restaurant_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('restaurant_id', restaurantId)
      .in('status', ['active', 'trial', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

// POST /api/subscriptions/subscribe — create or switch subscription
router.post('/subscribe', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const schema = z.object({ plan_id: z.string().uuid() })
    const body = schema.parse(req.body)

    // Verify plan exists
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', body.plan_id)
      .single()
    if (!plan) throw new NotFoundError('Plan not found')

    // Cancel any existing active subscriptions
    await supabaseAdmin
      .from('restaurant_subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('restaurant_id', restaurantId)
      .in('status', ['active', 'trial', 'past_due'])

    // Create new subscription
    const now = new Date()
    const periodEnd = new Date(now)
    if (plan.interval === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    }

    const { data: sub, error } = await supabaseAdmin
      .from('restaurant_subscriptions')
      .insert({
        restaurant_id: restaurantId,
        plan_id: body.plan_id,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select('*, subscription_plans(*)')
      .single()

    if (error) throw error
    res.status(201).json({ success: true, data: sub })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

// PUT /api/subscriptions/cancel — cancel current subscription
router.put('/cancel', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('restaurant_subscriptions')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .in('status', ['active', 'trial', 'past_due'])
      .single()

    if (fetchError || !existing) throw new NotFoundError('No active subscription')

    const { data, error } = await supabaseAdmin
      .from('restaurant_subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

export default router
