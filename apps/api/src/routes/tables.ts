import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { ValidationError } from '../lib/errors.js'

const router = Router()

router.get('/:restaurantId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params

    const { data: tables, error } = await supabaseAdmin
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('label', { ascending: true })

    if (error) throw error

    res.json({ success: true, data: tables })
  } catch (err) {
    next(err)
  }
})

router.put('/:id/status', authenticate, requireRole('server', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['empty', 'seated', 'ordered', 'needs_bill', 'needs_cleaning']
    if (!status || !validStatuses.includes(status)) {
      throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`)
    }

    const { data: table, error } = await supabaseAdmin
      .from('tables')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!table) {
      return res.status(404).json({ success: false, error: 'Table not found' })
    }

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${table.restaurant_id}:staff`).emit('table:updated', table)
    }

    res.json({ success: true, data: table })
  } catch (err) {
    next(err)
  }
})

export default router
