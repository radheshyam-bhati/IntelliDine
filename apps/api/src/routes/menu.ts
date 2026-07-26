import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createMenuItemSchema, updateMenuItemSchema } from '../lib/validation.js'
import { ValidationError, NotFoundError } from '../lib/errors.js'
import { z } from 'zod'

const router = Router()

const createCategorySchema = z.object({
  restaurant_id: z.string().uuid('Restaurant ID must be a valid UUID'),
  name: z.string().min(1, 'Name is required').max(200),
  display_order: z.number().int().nonnegative().optional().default(0),
})

const toggleAvailabilitySchema = z.object({
  is_available: z.boolean(),
})

async function getOptionalUser(req: Request): Promise<{ isStaff: boolean }> {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isStaff: false }
  }

  try {
    const token = authHeader.slice(7)
    const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !authUser) return { isStaff: false }

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!profile) return { isStaff: false }
    return { isStaff: profile.role !== 'customer' }
  } catch {
    return { isStaff: false }
  }
}

router.get('/:restaurantId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params
    const { isStaff } = await getOptionalUser(req)

    let lookupQuery = supabaseAdmin
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .maybeSingle()

    if (!restaurantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/)) {
      lookupQuery = supabaseAdmin
        .from('restaurants')
        .select('id')
        .eq('slug', restaurantId)
        .maybeSingle()
    }

    const { data: restaurant } = await lookupQuery
    const resolvedId = restaurant?.id || restaurantId

    const { data: categories, error: catError } = await supabaseAdmin
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', resolvedId)
      .order('display_order', { ascending: true })

    if (catError) throw catError

    let itemsQuery = supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', resolvedId)
      .order('name', { ascending: true })

    if (!isStaff) {
      itemsQuery = itemsQuery.eq('is_available', true)
    }

    const { data: items, error: itemError } = await itemsQuery

    if (itemError) throw itemError

    res.json({ success: true, data: { categories, items } })
  } catch (err) {
    next(err)
  }
})

router.post('/categories', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createCategorySchema.parse(req.body)

    const { data: category, error } = await supabaseAdmin
      .from('menu_categories')
      .insert({
        restaurant_id: body.restaurant_id,
        name: body.name,
        display_order: body.display_order,
      })
      .select()
      .single()

    if (error) throw error

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${body.restaurant_id}:staff`).emit('notification', {
        type: 'category_created',
        message: `Category "${category.name}" created`,
        data: category,
      })
    }

    res.status(201).json({ success: true, data: category })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

router.post('/items', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createMenuItemSchema.parse(req.body)

    const { data: item, error } = await supabaseAdmin
      .from('menu_items')
      .insert({
        restaurant_id: body.restaurant_id,
        category_id: body.category_id,
        name: body.name,
        description: body.description,
        price: body.price,
        image_url: body.image_url,
        dietary_tags: body.dietary_tags,
        is_manual_override: body.is_manual_override,
        availability_window: body.availability_window,
        is_available: true,
      })
      .select()
      .single()

    if (error) throw error

    if (body.ingredient_ids.length > 0) {
      const links = body.ingredient_ids.map((ingredientId: string) => ({
        menu_item_id: item.id,
        ingredient_id: ingredientId,
        quantity_required: 0,
      }))

      const { error: linkError } = await supabaseAdmin
        .from('menu_item_ingredients')
        .insert(links)

      if (linkError) throw linkError
    }

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${body.restaurant_id}:staff`).emit('notification', {
        type: 'menu_item_created',
        message: `Item "${item.name}" created`,
        data: item,
      })
    }

    res.status(201).json({ success: true, data: item })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

router.put('/items/:id', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const body = updateMenuItemSchema.parse(req.body)

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('menu_items')
      .select('id, restaurant_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      throw new NotFoundError('Menu item not found')
    }

    const { data: item, error } = await supabaseAdmin
      .from('menu_items')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${existing.restaurant_id}:staff`).emit('notification', {
        type: 'menu_item_updated',
        message: `Item "${item.name}" updated`,
        data: item,
      })
    }

    res.json({ success: true, data: item })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

router.put('/items/:id/availability', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const body = toggleAvailabilitySchema.parse(req.body)

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      throw new NotFoundError('Menu item not found')
    }

    const { data: item, error } = await supabaseAdmin
      .from('menu_items')
      .update({
        is_available: body.is_available,
        is_manual_override: body.is_available !== undefined,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const io = req.app.get('io')
    if (io) {
      io.to(`restaurant:${existing.restaurant_id}:staff`).emit('menu:availability', item)
      io.to(`restaurant:${existing.restaurant_id}:customers`).emit('menu:availability', item)
    }

    res.json({ success: true, data: item })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ValidationError('Validation failed', err.errors))
    }
    next(err)
  }
})

export default router
