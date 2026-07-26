import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { queryDashboard } from '../services/gemini.js'
import { gatherRestaurantContext } from '../lib/admin-context.js'
import { z } from 'zod'
import { ValidationError } from '../lib/errors.js'

const router = Router()

const querySchema = z.object({
  question: z.string().min(1, 'Question is required').max(1000),
})

router.post('/query', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = querySchema.parse(req.body)
    const restaurantId = req.user!.restaurant_id

    if (!restaurantId) {
      throw new ValidationError('Manager account is not associated with a restaurant')
    }

    const context = await gatherRestaurantContext(supabaseAdmin, restaurantId)
    const result = await queryDashboard(body.question, context)

    res.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

export default router
