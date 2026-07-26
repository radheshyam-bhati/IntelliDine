'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import type { MenuCategory, MenuItem } from '@kitchensync/shared'
import MenuItemCard from '@/components/MenuItemCard'
import CartBar from '@/components/CartBar'
import { useCart } from '@/lib/cart-context'
import { connect } from '@/lib/socket'

type MenuItemWithOrders = MenuItem & { order_count?: number }

export default function CustomerMenuPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const tableId = searchParams.get('table') || undefined

  const [categories, setCategories] = useState<
    (MenuCategory & { items: MenuItem[] })[]
  >([])
  const [recommendations, setRecommendations] = useState<MenuItemWithOrders[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const { addItem, items, clearCart } = useCart()

  useEffect(() => {
    let cancelled = false

    async function fetchMenu() {
      try {
        setLoading(true)
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
        const [menuRes, recRes] = await Promise.all([
          fetch(`${api}/restaurants/${slug}/menu`),
          fetch(`${api}/restaurants/${slug}/recommendations`),
        ])
        const [menuData, recData] = await Promise.all([menuRes.json(), recRes.json()])
        if (!cancelled) {
          if (menuData.success) setCategories(menuData.data)
          else setError(menuData.error || 'Failed to load menu')
          if (recData.success) setRecommendations(recData.data || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Network error')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMenu()
    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    const socket = connect(slug, '', slug)
    socket.on('menu:availability', (updatedItem: MenuItem) => {
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: cat.items.map((item) =>
            item.id === updatedItem.id ? updatedItem : item
          ),
        }))
      )
    })
    return () => {
      socket.disconnect()
    }
  }, [slug])

  const handleSubmitOrder = useCallback(async () => {
    const unavailableItems = items.filter((i) => !i.menuItem.is_available)
    if (unavailableItems.length > 0) {
      setNotification(
        `Some items are no longer available: ${unavailableItems.map((i) => i.menuItem.name).join(', ')}`
      )
      return
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantSlug: slug,
            tableId,
            items: items.map((i) => ({
              menuItemId: i.menuItem.id,
              quantity: i.quantity,
              unitPrice: i.menuItem.price,
            })),
          }),
        }
      )
      const data = await res.json()
      if (data.success) {
        const orderId = data.data?.id
        clearCart()
        if (orderId) {
          router.push(`/menu/${slug}/order/${orderId}`)
        } else {
          setNotification('Order placed successfully!')
        }
      } else {
        setNotification(data.error || 'Failed to place order')
      }
    } catch (err) {
      setNotification(
        err instanceof Error ? err.message : 'Failed to place order'
      )
    }
  }, [items, slug, tableId, clearCart])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 text-lg animate-pulse">Loading menu...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">Unable to load menu</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24">
      {notification && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-2xl mx-auto">
          <div className="rounded-lg bg-gray-900 text-white px-4 py-3 text-sm text-center shadow-lg">
            {notification}
          </div>
        </div>
      )}

      <div className="px-4 py-8">
        <h1 className="font-serif text-4xl text-gray-900 mb-2">Menu</h1>
        {tableId && (
          <p className="text-sm text-amber-700">Table {tableId}</p>
        )}
      </div>

      {recommendations.length > 0 && (
        <section className="mb-8">
          <div className="px-4 mb-4">
            <h2 className="font-serif text-2xl text-amber-800 border-b border-amber-300 pb-2">
              Popular
            </h2>
          </div>
          <div className="px-4 space-y-3">
            {recommendations.map((item) => (
              <div key={item.id} className="relative">
                {item.order_count && item.order_count >= 10 && (
                  <span className="absolute -top-1 -right-1 z-10 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    Hot
                  </span>
                )}
                <MenuItemCard
                  item={item}
                  onAddToCart={() => { if (item.is_available) addItem(item) }}
                  expanded={expandedItem === item.id}
                  onToggleExpand={() =>
                    setExpandedItem(expandedItem === item.id ? null : item.id)
                  }
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {categories.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No menu items available</p>
      ) : (
        categories.map((category) => (
          <section key={category.id} className="mb-8">
            <div className="px-4 mb-4">
              <h2 className="font-serif text-3xl text-gray-800 border-b border-amber-200 pb-2">
                {category.name}
              </h2>
            </div>
            <div className="px-4 space-y-3">
              {category.items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={() => {
                    if (item.is_available) addItem(item)
                  }}
                  expanded={expandedItem === item.id}
                  onToggleExpand={() =>
                    setExpandedItem(
                      expandedItem === item.id ? null : item.id
                    )
                  }
                />
              ))}
            </div>
          </section>
        ))
      )}

      <CartBar onSubmitOrder={handleSubmitOrder} />
    </div>
  )
}
