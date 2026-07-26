import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createReservationSchema } from '../lib/validation.js'
import { ValidationError, NotFoundError } from '../lib/errors.js'
import { z } from 'zod'

const router = Router()

router.post('/', authenticate, requireRole('server', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createReservationSchema.parse(req.body)

    if (body.table_id) {
      const { data: existingReservations, error: checkError } = await supabaseAdmin
        .from('reservations')
        .select('id, reserved_for')
        .eq('table_id', body.table_id)
        .eq('restaurant_id', body.restaurant_id)
        .in('status', ['confirmed'])
        .gte('reserved_for', new Date(body.reserved_for).toISOString())
        .lte('reserved_for', new Date(new Date(body.reserved_for).getTime() + 2 * 60 * 60 * 1000).toISOString())

      if (checkError) throw checkError

      if (existingReservations && existingReservations.length > 0) {
        throw new ValidationError('Table is already reserved for this time slot')
      }

      const { data: table, error: tableError } = await supabaseAdmin
        .from('tables')
        .select('capacity')
        .eq('id', body.table_id)
        .single()

      if (tableError || !table) {
        throw new ValidationError('Table not found')
      }

      if (body.party_size > table.capacity) {
        throw new ValidationError(
          `Party size ${body.party_size} exceeds table capacity of ${table.capacity}`,
        )
      }
    }

    const { data: reservation, error } = await supabaseAdmin
      .from('reservations')
      .insert({
        restaurant_id: body.restaurant_id,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        party_size: body.party_size,
        reserved_for: body.reserved_for,
        table_id: body.table_id ?? null,
        status: 'confirmed',
      })
      .select()
      .single()

    if (error) throw error

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${body.restaurant_id}:staff`).emit('notification', {
        type: 'reservation_created',
        message: `Reservation for ${body.customer_name} (${body.party_size} guests)`,
        data: reservation,
      })
    }

    res.status(201).json({ success: true, data: reservation })
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
    const { status, date } = req.query

    let query = supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('reserved_for', { ascending: true })

    if (status && typeof status === 'string') {
      query = query.eq('status', status)
    }

    if (date && typeof date === 'string') {
      const startOfDay = `${date}T00:00:00Z`
      const endOfDay = `${date}T23:59:59Z`
      query = query.gte('reserved_for', startOfDay).lte('reserved_for', endOfDay)
    }

    const { data: reservations, error } = await query

    if (error) throw error

    res.json({ success: true, data: reservations })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', authenticate, requireRole('server', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { status, table_id } = req.body

    const validStatuses = ['confirmed', 'seated', 'cancelled', 'no_show']
    if (status && !validStatuses.includes(status)) {
      throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`)
    }

    const updates: Record<string, unknown> = {}
    if (status) updates.status = status
    if (table_id !== undefined) updates.table_id = table_id

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No fields to update')
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      throw new NotFoundError('Reservation not found')
    }

    const { data: reservation, error } = await supabaseAdmin
      .from('reservations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (status === 'seated') {
      const targetTableId = table_id ?? existing.table_id
      if (targetTableId) {
        await supabaseAdmin
          .from('tables')
          .update({ status: 'seated' })
          .eq('id', targetTableId)
      }
    }

    if ((status === 'cancelled' || status === 'no_show') && existing.table_id) {
      const { data: otherReservations } = await supabaseAdmin
        .from('reservations')
        .select('id')
        .eq('table_id', existing.table_id)
        .eq('status', 'confirmed')
        .neq('id', id)

      if (!otherReservations || otherReservations.length === 0) {
        const { data: seatedOrders } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('table_id', existing.table_id)
          .neq('status', 'cancelled')

        if (!seatedOrders || seatedOrders.length === 0) {
          await supabaseAdmin
            .from('tables')
            .update({ status: 'empty' })
            .eq('id', existing.table_id)
        }
      }
    }

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${existing.restaurant_id}:staff`).emit('notification', {
        type: 'reservation_updated',
        message: `Reservation for ${existing.customer_name} is now ${status || 'updated'}`,
        data: reservation,
      })
    }

    res.json({ success: true, data: reservation })
  } catch (err) {
    next(err)
  }
})

export default router
