import { supabaseAdmin } from '../lib/supabase-admin.js'

const FORECAST_SERVICE_URL = process.env.FORECAST_SERVICE_URL || 'http://localhost:8000'

interface ForecastItem {
  menu_item_id: string
  predicted_quantity: number
  basis: 'cold_start_baseline' | 'restaurant_trained'
  confidence: number
}

export async function generateForecasts(restaurantId: string): Promise<{
  success: boolean
  forecasts: ForecastItem[]
  error?: string
}> {
  const { data: menuItems, error: menuError } = await supabaseAdmin
    .from('menu_items')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('is_available', true)

  if (menuError || !menuItems || menuItems.length === 0) {
    return { success: false, forecasts: [], error: 'No menu items found' }
  }

  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const { data: orderItems, error: orderError } = await supabaseAdmin
    .from('order_items')
    .select('menu_item_id, quantity, orders!inner(created_at, restaurant_id)')
    .eq('orders.restaurant_id', restaurantId)
    .gte('orders.created_at', sixtyDaysAgo.toISOString())

  if (orderError) {
    return { success: false, forecasts: [], error: 'Failed to fetch order history' }
  }

  const historicalData = (orderItems || []).map((oi: any) => ({
    menu_item_id: oi.menu_item_id,
    date: oi.orders?.created_at?.slice(0, 10),
    quantity: oi.quantity,
  }))

  const forecastDate = new Date()
  forecastDate.setDate(forecastDate.getDate() + 1)
  const dateStr = forecastDate.toISOString().slice(0, 10)

  try {
    const response = await fetch(`${FORECAST_SERVICE_URL}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        menu_item_ids: menuItems.map((m) => m.id),
        forecast_date: dateStr,
        historical_data: historicalData,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return { success: false, forecasts: [], error: `Forecast service error: ${text}` }
    }

    const result = await response.json()
    const forecasts: ForecastItem[] = result.forecasts || []

    for (const fc of forecasts) {
      const { error: upsertError } = await supabaseAdmin.from('forecasts').upsert({
        restaurant_id: restaurantId,
        menu_item_id: fc.menu_item_id,
        forecast_date: dateStr,
        predicted_quantity: fc.predicted_quantity,
        basis: fc.basis,
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'restaurant_id,menu_item_id,forecast_date',
      })

      if (upsertError) {
        console.error(`[FORECAST] Failed to save forecast for ${fc.menu_item_id}`, upsertError)
      }
    }

    return { success: true, forecasts }
  } catch (err) {
    return {
      success: false,
      forecasts: [],
      error: err instanceof Error ? err.message : 'Failed to connect to forecast service',
    }
  }
}

export async function checkForecastServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${FORECAST_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}
