import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { ValidationError } from '../lib/errors.js'
import { z } from 'zod'

const router = Router()

const inviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(200),
  role: z.enum(['server', 'kitchen', 'manager']),
})

router.get('/staff', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'No restaurant associated' })
    }

    const { data: staff, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .neq('role', 'customer')
      .order('full_name', { ascending: true })

    if (error) throw error
    res.json({ success: true, data: staff || [] })
  } catch (err) {
    next(err)
  }
})

router.post('/invite', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = inviteSchema.parse(req.body)
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'No restaurant associated' })
    }

    const { data: authUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(body.email)
    if (inviteError || !authUser?.user) {
      return res.status(400).json({ success: false, error: inviteError?.message || 'Failed to invite user' })
    }

    const { data: user, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        restaurant_id: restaurantId,
        role: body.role,
        full_name: body.fullName,
      })
      .select()
      .single()

    if (profileError) {
      throw profileError
    }

    res.status(201).json({ success: true, data: user })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

export default router
