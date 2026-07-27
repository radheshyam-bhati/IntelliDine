import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate } from '../middleware/auth.js'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { z } from 'zod'

const router = Router()

// ──────────────────────────────
// FAVORITES
// ──────────────────────────────

// GET /api/customers/favorites — list customer's favorites with menu item data
router.get('/customers/favorites', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id

    const { data, error } = await supabaseAdmin
      .from('customer_favorites')
      .select('*, menu_items(*)')
      .eq('user_id', userId)

    if (error) throw error

    const items = (data || []).map((fav: any) => ({
      id: fav.id,
      user_id: fav.user_id,
      menu_item_id: fav.menu_item_id,
      created_at: fav.created_at,
      menuItem: fav.menu_items || null,
    }))

    res.json({ success: true, data: items })
  } catch (err) { next(err) }
})

// POST /api/customers/favorites — add favorite
router.post('/customers/favorites', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const schema = z.object({ menu_item_id: z.string().uuid() })
    const body = schema.parse(req.body)

    // Check if already favorited
    const { data: existing } = await supabaseAdmin
      .from('customer_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('menu_item_id', body.menu_item_id)
      .maybeSingle()

    if (existing) {
      return res.json({ success: true, data: existing })
    }

    const { data, error } = await supabaseAdmin
      .from('customer_favorites')
      .insert({ user_id: userId, menu_item_id: body.menu_item_id })
      .select('*, menu_items(*)')
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      data: {
        id: data.id,
        user_id: data.user_id,
        menu_item_id: data.menu_item_id,
        created_at: data.created_at,
        menuItem: data.menu_items || null,
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

// DELETE /api/customers/favorites/:id — remove favorite
router.delete('/customers/favorites/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const { data: existing } = await supabaseAdmin
      .from('customer_favorites')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!existing) throw new NotFoundError('Favorite not found')

    const { error } = await supabaseAdmin.from('customer_favorites').delete().eq('id', id)
    if (error) throw error

    res.json({ success: true, data: { message: 'Favorite removed' } })
  } catch (err) { next(err) }
})

// ──────────────────────────────
// LOYALTY POINTS
// ──────────────────────────────

// GET /api/customers/loyalty/points — get points history
router.get('/customers/loyalty/points', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id

    const { data, error } = await supabaseAdmin
      .from('loyalty_points')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) { next(err) }
})

// ──────────────────────────────
// REWARDS
// ──────────────────────────────

// GET /api/rewards — list available rewards for this restaurant
router.get('/rewards', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) return res.status(400).json({ success: false, error: 'No restaurant associated' })

    const { data, error } = await supabaseAdmin
      .from('rewards')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('points_required', { ascending: true })

    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) { next(err) }
})

// GET /api/customers/loyalty/rewards — get customer's redeemed rewards
router.get('/customers/loyalty/rewards', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id

    const { data, error } = await supabaseAdmin
      .from('customer_rewards')
      .select('*, rewards(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const items = (data || []).map((cr: any) => ({
      id: cr.id,
      user_id: cr.user_id,
      reward_id: cr.reward_id,
      points_used: cr.points_used,
      status: cr.status,
      used_at: cr.used_at,
      expires_at: cr.expires_at,
      created_at: cr.created_at,
      reward: cr.rewards || null,
    }))

    res.json({ success: true, data: items })
  } catch (err) { next(err) }
})

// POST /api/customers/loyalty/redeem — redeem a reward
router.post('/customers/loyalty/redeem', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const restaurantId = req.user!.restaurant_id
    const schema = z.object({ reward_id: z.string().uuid() })
    const body = schema.parse(req.body)

    // Get the reward
    const { data: reward } = await supabaseAdmin
      .from('rewards')
      .select('*')
      .eq('id', body.reward_id)
      .eq('is_active', true)
      .single()
    if (!reward) throw new NotFoundError('Reward not found or inactive')

    // Calculate available points
    const { data: points } = await supabaseAdmin
      .from('loyalty_points')
      .select('points, type')
      .eq('user_id', userId)

    const totalEarned = (points || [])
      .filter(p => p.type === 'earned' || p.type === 'bonus')
      .reduce((sum, p) => sum + p.points, 0)
    const totalRedeemed = (points || [])
      .filter(p => p.type === 'redeemed')
      .reduce((sum, p) => sum + p.points, 0)
    const available = totalEarned - totalRedeemed

    if (available < reward.points_required) {
      throw new ValidationError('Insufficient points')
    }

    // Deduct points
    const { error: deductError } = await supabaseAdmin
      .from('loyalty_points')
      .insert({
        user_id: userId,
        restaurant_id: restaurantId,
        points: reward.points_required,
        type: 'redeemed',
        reference: `Redeemed: ${reward.name}`,
      })
    if (deductError) throw deductError

    // Create customer reward
    const { data: customerReward, error: crError } = await supabaseAdmin
      .from('customer_rewards')
      .insert({
        user_id: userId,
        reward_id: body.reward_id,
        points_used: reward.points_required,
        status: 'active',
      })
      .select('*, rewards(*)')
      .single()
    if (crError) throw crError

    res.status(201).json({
      success: true,
      data: {
        id: customerReward.id,
        user_id: customerReward.user_id,
        reward_id: customerReward.reward_id,
        points_used: customerReward.points_used,
        status: customerReward.status,
        used_at: customerReward.used_at,
        expires_at: customerReward.expires_at,
        created_at: customerReward.created_at,
        reward: customerReward.rewards || null,
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ValidationError('Validation failed', err.errors))
    next(err)
  }
})

// ──────────────────────────────
// WALLET
// ──────────────────────────────

// GET /api/customers/wallet — get wallet balance
router.get('/customers/wallet', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id

    const { data, error } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      // Create wallet if it doesn't exist
      const { data: newWallet, error: createError } = await supabaseAdmin
        .from('wallets')
        .insert({ user_id: userId, balance: 0 })
        .select()
        .single()
      if (createError) throw createError
      return res.json({ success: true, data: newWallet })
    }

    res.json({ success: true, data })
  } catch (err) { next(err) }
})

export default router
