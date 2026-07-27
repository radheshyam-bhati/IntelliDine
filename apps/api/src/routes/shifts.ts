import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { z } from 'zod'

const router = Router()

// ──────────────────────────────
// SHIFT DEFINITIONS
// ──────────────────────────────

const createDefSchema = z.object({
  name: z.string().min(1).max(200),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  min_staff: z.number().int().nonnegative().default(1),
  max_staff: z.number().int().nonnegative().default(3),
})

// GET /api/shifts/definitions — list shift definitions
router.get('/definitions', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { data, error } = await supabaseAdmin
      .from('shift_definitions')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) { next(err) }
})

// POST /api/shifts/definitions — create shift definition
router.post('/definitions', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const body = createDefSchema.parse(req.body)
    const { data, error } = await supabaseAdmin
      .from('shift_definitions')
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

// ──────────────────────────────
// SHIFT ASSIGNMENTS
// ──────────────────────────────

const createAssignmentSchema = z.object({
  shift_definition_id: z.string().uuid(),
  user_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
})

const updateAssignmentSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'absent']),
})

// GET /api/shifts/assignments — list assignments for a date
router.get('/assignments', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { date } = req.query
    let query = supabaseAdmin
      .from('shift_assignments')
      .select('*, shift_definitions!inner(*), users!inner(full_name, email, role)')
      .eq('shift_definitions.restaurant_id', restaurantId)
      .order('start_time', { ascending: true })

    if (date && typeof date === 'string') {
      query = query.eq('date', date)
    }

    const { data, error } = await query
    if (error) throw error

    // Flatten the nested structure for cleaner API
    const items = (data || []).map((a: any) => ({
      id: a.id,
      shift_definition_id: a.shift_definition_id,
      user_id: a.user_id,
      date: a.date,
      start_time: a.start_time,
      end_time: a.end_time,
      role: a.users?.role || null,
      status: a.status,
      notes: a.notes,
      created_at: a.created_at,
      user_name: a.users?.full_name || a.users?.email || 'Unknown',
      shift_name: a.shift_definitions?.name || 'Unknown',
    }))

    res.json({ success: true, data: items })
  } catch (err) { next(err) }
})

// POST /api/shifts/assignments — create assignment
router.post('/assignments', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createAssignmentSchema.parse(req.body)
    const { data, error } = await supabaseAdmin
      .from('shift_assignments')
      .insert(body)
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

// PUT /api/shifts/assignments/:id — update assignment status
router.put('/assignments/:id', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const body = updateAssignmentSchema.parse(req.body)

    const { data: existing } = await supabaseAdmin
      .from('shift_assignments')
      .select('id')
      .eq('id', id)
      .single()
    if (!existing) throw new NotFoundError('Assignment not found')

    const { data, error } = await supabaseAdmin
      .from('shift_assignments')
      .update({ status: body.status })
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
