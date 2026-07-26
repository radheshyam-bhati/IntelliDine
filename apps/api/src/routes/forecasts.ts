import { Router, Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { generateForecasts, checkForecastServiceHealth } from '../services/forecast-client.js'

const router = Router()

router.get('/', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'No restaurant associated' })
    }

    const { date } = req.query
    const forecastDate = typeof date === 'string' && date ? date : new Date().toISOString().slice(0, 10)

    let query = supabaseAdmin
      .from('forecasts')
      .select('*')
      .eq('restaurant_id', restaurantId)

    if (forecastDate) {
      query = query.eq('forecast_date', forecastDate)
    }

    const { data: forecasts, error } = await query.order('forecast_date', { ascending: true })

    if (error) throw error
    res.json({ success: true, data: forecasts || [] })
  } catch (err) {
    next(err)
  }
})

router.post('/generate', authenticate, requireRole('manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user!.restaurant_id
    if (!restaurantId) {
      return res.status(400).json({ success: false, error: 'No restaurant associated' })
    }

    const result = await generateForecasts(restaurantId)

    if (!result.success) {
      return res.status(502).json({ success: false, error: result.error || 'Forecast generation failed' })
    }

    res.json({ success: true, data: { forecasts: result.forecasts, count: result.forecasts.length } })
  } catch (err) {
    next(err)
  }
})

router.get('/health', authenticate, requireRole('manager'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const healthy = await checkForecastServiceHealth()
    res.json({ success: true, data: { forecast_service: healthy ? 'connected' : 'unreachable' } })
  } catch (err) {
    next(err)
  }
})

export default router
