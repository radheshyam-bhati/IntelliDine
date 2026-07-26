import { SupabaseClient } from '@supabase/supabase-js'
import { Server as SocketServer } from 'socket.io'

export async function recalculateAvailability(
  ingredientId: string,
  supabase: SupabaseClient,
  io: SocketServer | null,
): Promise<void> {
  const { data: ingredient, error: ingError } = await supabase
    .from('ingredients')
    .select('*')
    .eq('id', ingredientId)
    .single()

  if (ingError || !ingredient) {
    console.error(`[CASCADE] Ingredient not found: ${ingredientId}`)
    return
  }

  const isLow = ingredient.current_stock <= ingredient.reorder_threshold
  const newAvailability = !isLow

  const { data: links, error: linkError } = await supabase
    .from('menu_item_ingredients')
    .select('menu_item_id')
    .eq('ingredient_id', ingredientId)

  if (linkError) {
    console.error(`[CASCADE] Failed to fetch menu_item_ingredients for ${ingredientId}`, linkError)
    return
  }

  if (!links || links.length === 0) return

  const menuItemIds = links.map((l) => l.menu_item_id)

  const { data: items, error: itemError } = await supabase
    .from('menu_items')
    .select('*')
    .in('id', menuItemIds)

  if (itemError || !items) {
    console.error(`[CASCADE] Failed to fetch menu items`, itemError)
    return
  }

  for (const item of items) {
    if (item.is_manual_override) continue

    if (item.is_available !== newAvailability) {
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ is_available: newAvailability })
        .eq('id', item.id)

      if (updateError) {
        console.error(`[CASCADE] Failed to update menu item ${item.id}`, updateError)
        continue
      }

      if (io) {
        const updatedItem = { ...item, is_available: newAvailability }
        io.to(`restaurant:${item.restaurant_id}:staff`).emit('menu:availability', updatedItem)
        io.to(`restaurant:${item.restaurant_id}:customers`).emit('menu:availability', updatedItem)
      }
    }
  }
}

export async function processOrderDeduction(
  orderId: string,
  supabase: SupabaseClient,
  io: SocketServer | null,
): Promise<void> {
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*, menu_items!inner(restaurant_id)')
    .eq('order_id', orderId)

  if (itemsError || !orderItems || orderItems.length === 0) {
    console.error(`[CASCADE] Failed to fetch order items for order ${orderId}`, itemsError)
    return
  }

  const menuItemIds = orderItems.map((oi) => oi.menu_item_id)

  const { data: links, error: linkError } = await supabase
    .from('menu_item_ingredients')
    .select('*')
    .in('menu_item_id', menuItemIds)

  if (linkError) {
    console.error(`[CASCADE] Failed to fetch menu_item_ingredients`, linkError)
    return
  }

  if (!links || links.length === 0) return

  for (const orderItem of orderItems) {
    const matchingLinks = links.filter((l) => l.menu_item_id === orderItem.menu_item_id)

    for (const link of matchingLinks) {
      const deductionAmount = link.quantity_required * orderItem.quantity

      if (deductionAmount === 0) continue

      const { error: deductError } = await supabase.rpc('deduct_ingredient_stock', {
        p_ingredient_id: link.ingredient_id,
        p_amount: deductionAmount,
      })

      if (deductError) {
        console.error(`[CASCADE] RPC deduct_ingredient_stock failed for ${link.ingredient_id}`, deductError)

        const { data: ingredient, error: fetchError } = await supabase
          .from('ingredients')
          .select('current_stock')
          .eq('id', link.ingredient_id)
          .single()

        if (fetchError) {
          console.error(`[CASCADE] Failed to fetch ingredient ${link.ingredient_id}`, fetchError)
          continue
        }

        if (ingredient) {
          const newStock = Math.max(0, ingredient.current_stock - deductionAmount)
          const { error: updateError } = await supabase
            .from('ingredients')
            .update({ current_stock: newStock })
            .eq('id', link.ingredient_id)

          if (updateError) {
            console.error(`[CASCADE] Failed to update ingredient ${link.ingredient_id}`, updateError)
            continue
          }
        }
      }

      const { error: adjError } = await supabase.from('inventory_adjustments').insert({
        ingredient_id: link.ingredient_id,
        change_amount: -deductionAmount,
        reason: 'order_deduction',
        order_id: orderId,
      })

      if (adjError) {
        console.error(`[CASCADE] Failed to record inventory adjustment`, adjError)
      }

      await recalculateAvailability(link.ingredient_id, supabase, io)
    }
  }

  if (io) {
    const restaurantId = orderItems[0].restaurant_id
    io.to(`restaurant:${restaurantId}:staff`).emit('ingredient:updated', {
      message: 'Inventory updated after order processing',
      order_id: orderId,
    })
  }
}
