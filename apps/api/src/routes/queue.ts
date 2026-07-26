import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createQueueEntrySchema } from '../lib/validation.js'
import { ValidationError, NotFoundError } from '../lib/errors.js'
import { z } from 'zod'

const router = Router()

const AVG_WAIT_MINUTES_PER_PARTY = 25

router.post('/', authenticate, requireRole('server', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createQueueEntrySchema.parse(req.body)

    const { data: waitingEntries, error: countError } = await supabaseAdmin
      .from('queue_entries')
      .select('id')
      .eq('restaurant_id', body.restaurant_id)
      .eq('status', 'waiting')

    if (countError) throw countError

    const waitingCount = waitingEntries?.length || 0
    const estimatedWaitMinutes = (waitingCount + 1) * AVG_WAIT_MINUTES_PER_PARTY

    const { data: entry, error } = await supabaseAdmin
      .from('queue_entries')
      .insert({
        restaurant_id: body.restaurant_id,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        party_size: body.party_size,
        status: 'waiting',
      })
      .select()
      .single()

    if (error) throw error

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${body.restaurant_id}:staff`).emit('queue:updated', entry)
    }

    res.status(201).json({
      success: true,
      data: {
        ...entry,
        estimated_wait_minutes: estimatedWaitMinutes,
      },
    })
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
    const { status } = req.query

    let query = supabaseAdmin
      .from('queue_entries')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('joined_at', { ascending: true })

    if (status && typeof status === 'string') {
      query = query.eq('status', status)
    }

    const { data: entries, error } = await query

    if (error) throw error

    let waitIndex = 0
    const entriesWithWait = entries.map((e) => {
      if (e.status === 'waiting') {
        waitIndex++
        return { ...e, estimated_wait_minutes: waitIndex * AVG_WAIT_MINUTES_PER_PARTY }
      }
      return { ...e, estimated_wait_minutes: 0 }
    })

    res.json({ success: true, data: entriesWithWait })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', authenticate, requireRole('server', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { status, table_id } = req.body

    const validStatuses = ['waiting', 'notified', 'seated', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`)
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('queue_entries')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      throw new NotFoundError('Queue entry not found')
    }

    const updates: Record<string, unknown> = { status }
    if (table_id !== undefined) updates.table_id = table_id

    const { data: entry, error } = await supabaseAdmin
      .from('queue_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (status === 'seated' && table_id) {
      await supabaseAdmin
        .from('tables')
        .update({ status: 'seated' })
        .eq('id', table_id)
    }

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${existing.restaurant_id}:staff`).emit('queue:updated', entry)
    }

    res.json({ success: true, data: entry })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

export default router
