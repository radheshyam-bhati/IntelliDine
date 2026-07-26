import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createIngredientSchema, updateIngredientSchema } from '../lib/validation.js'
import { ValidationError, NotFoundError } from '../lib/errors.js'
import { recalculateAvailability } from '../services/cascade.js'
import { z } from 'zod'

const router = Router()

router.get('/:restaurantId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params

    const { data: ingredients, error } = await supabaseAdmin
      .from('ingredients')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name', { ascending: true })

    if (error) throw error

    res.json({ success: true, data: ingredients })
  } catch (err) {
    next(err)
  }
})

router.get('/:restaurantId/low', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params

    const { data: ingredients, error } = await supabaseAdmin
      .from('ingredients')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name', { ascending: true })

    if (error) throw error

    const lowStock = ingredients.filter((ing) => ing.current_stock <= ing.reorder_threshold)

    res.json({ success: true, data: lowStock })
  } catch (err) {
    next(err)
  }
})

router.post('/', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createIngredientSchema.parse(req.body)

    const { data: ingredient, error } = await supabaseAdmin
      .from('ingredients')
      .insert({
        restaurant_id: body.restaurant_id,
        name: body.name,
        unit: body.unit,
        current_stock: body.current_stock,
        reorder_threshold: body.reorder_threshold,
        supplier_name: body.supplier_name ?? null,
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ success: true, data: ingredient })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

router.put('/:id', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const body = updateIngredientSchema.parse(req.body)

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('ingredients')
      .select('id, restaurant_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      throw new NotFoundError('Ingredient not found')
    }

    const { data: ingredient, error } = await supabaseAdmin
      .from('ingredients')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const io = req.app.get('io')
    await recalculateAvailability(id, supabaseAdmin, io)

    res.json({ success: true, data: ingredient })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

router.post('/:id/adjust', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { change_amount, reason, note } = req.body

    if (typeof change_amount !== 'number' || change_amount === 0) {
      throw new ValidationError('change_amount must be a non-zero number')
    }

    const validReasons = ['order_deduction', 'manual_restock', 'waste_logged', 'correction']
    if (!reason || !validReasons.includes(reason)) {
      throw new ValidationError(`reason must be one of: ${validReasons.join(', ')}`)
    }

    const { data: ingredient, error: fetchError } = await supabaseAdmin
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !ingredient) {
      throw new NotFoundError('Ingredient not found')
    }

    const newStock = Math.max(0, ingredient.current_stock + change_amount)

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('ingredients')
      .update({ current_stock: newStock })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    const { error: adjError } = await supabaseAdmin
      .from('inventory_adjustments')
      .insert({
        ingredient_id: id,
        change_amount,
        reason,
        note: note ?? null,
        created_by_user_id: req.user?.id ?? null,
      })

    if (adjError) throw adjError

    const io = req.app.get('io')
    await recalculateAvailability(id, supabaseAdmin, io)

    if (io) {
      io.to(`restaurant:${ingredient.restaurant_id}:staff`).emit('ingredient:updated', updated)
    }

    res.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

export default router
