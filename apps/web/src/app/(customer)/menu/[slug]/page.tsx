'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { MenuCategory, MenuItem, Restaurant } from '@kitchensync/shared'
import MenuItemCard from '@/components/menu/MenuItemCard'
import DishDetailModal from '@/components/menu/DishDetailModal'
import CartBar from '@/components/menu/CartBar'
import { useCart } from '@/lib/cart-context'
import { connect } from '@/lib/socket'

type MenuItemWithOrders = MenuItem & { order_count?: number }

const DIETARY_TAGS = ['vegetarian', 'vegan', 'gluten_free', 'halal', 'dairy_free', 'nut_free', 'organic', 'spicy']
const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name', label: 'A to Z' },
]

export default function CustomerMenuPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const tableId = searchParams.get('table') || undefined

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [categories, setCategories] = useState<(MenuCategory & { items: MenuItem[] })[]>([])
  const [recommendations, setRecommendations] = useState<MenuItemWithOrders[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('popular')
  const [showFilters, setShowFilters] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [showDishDetail, setShowDishDetail] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [eightySixedItems, setEightySixedItems] = useState<Record<string, boolean>>({})
  const [lastEightySixItems, setLastEightySixItems] = useState<Record<string, boolean>>({})
  const categoryNavRef = useRef<HTMLDivElement>(null)
  const categoryRefs = useRef<Map<string, HTMLElement>>(new Map())

  const { addItem, items, clearCart } = useCart()

  // Fetch restaurant info and menu
  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        setLoading(true)
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
        const [restaurantRes, menuRes, recRes] = await Promise.all([
          fetch(`${api}/restaurants/${slug}`),
          fetch(`${api}/restaurants/${slug}/menu`),
          fetch(`${api}/restaurants/${slug}/recommendations`),
        ])
        const [restaurantData, menuData, recData] = await Promise.all([
          restaurantRes.json(),
          menuRes.json(),
          recRes.json(),
        ])
        if (!cancelled) {
          if (restaurantData.success) setRestaurant(restaurantData.data)
          if (menuData.success) {
            setCategories(menuData.data)
            if (menuData.data.length > 0) setActiveCategory(menuData.data[0].id)
          } else setError(menuData.error || 'Failed to load menu')
          if (recData.success) setRecommendations(recData.data || [])
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Network error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [slug])

  // Socket.IO for real-time updates
  useEffect(() => {
    const socket = connect(slug, '', slug)
    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

    socket.on('menu:availability', (updatedItem: MenuItem) => {
      setCategories(prev =>
        prev.map(cat => ({
          ...cat,
          items: cat.items.map(item => item.id === updatedItem.id ? updatedItem : item),
        }))
      )
      // Track 86'd items
      if (!updatedItem.is_available) {
        setEightySixedItems(prev => ({ ...prev, [updatedItem.id]: true }))
      } else {
        setEightySixedItems(prev => {
          const next = { ...prev }
          delete next[updatedItem.id]
          return next
        })
      }
    })

    socket.on('order:updated', () => {
      // Could trigger order tracker refresh here
    })

    return () => { socket.disconnect() }
  }, [slug])

  // Intersection observer for category nav
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.getAttribute('data-category-id') || 'all')
          }
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    )

    categoryRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [categories])

  const toggleFilter = (tag: string) => {
    setActiveFilters(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId)
    const el = categoryRefs.current.get(categoryId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const allMenuItems = categories.flatMap(c => c.items)
  const filteredItems = allMenuItems.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!item.name.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q)) {
        return false
      }
    }
    if (activeFilters.length > 0 && !activeFilters.every(f => item.dietary_tags?.includes(f))) {
      return false
    }
    return true
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc': return a.price - b.price
      case 'price_desc': return b.price - a.price
      case 'popular': return ((b as MenuItemWithOrders).order_count || 0) - ((a as MenuItemWithOrders).order_count || 0)
      default: return a.name.localeCompare(b.name)
    }
  })

  const handleAddToCart = useCallback((item: MenuItem, quantity: number, specialRequest?: string) => {
    addItem(item, quantity, specialRequest)
    setNotification(`${item.name} added to cart`)
  }, [addItem])

  const handleItemClick = useCallback((item: MenuItem) => {
    setSelectedItem(item)
    setShowDishDetail(true)
  }, [])

  const handleSubmitOrder = useCallback(async () => {
    const unavailableItems = items.filter(i => !i.menuItem.is_available)
    if (unavailableItems.length > 0) {
      setNotification(
        `Some items are no longer available: ${unavailableItems.map(i => i.menuItem.name).join(', ')}. Please remove them and try again.`
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
            items: items.map(i => ({
              menuItemId: i.menuItem.id,
              quantity: i.quantity,
              unitPrice: i.menuItem.price,
              specialRequest: i.specialRequest,
            })),
          }),
        }
      )
      const data = await res.json()
      if (data.success) {
        const orderId = data.data?.id
        clearCart()
        if (orderId) router.push(`/menu/${slug}/order/${orderId}`)
        else setNotification('Order placed successfully!')
      } else {
        setNotification(data.error || 'Failed to place order')
      }
    } catch (err) {
      setNotification(err instanceof Error ? err.message : 'Failed to place order')
    }
  }, [items, slug, tableId, clearCart, router])

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(t)
    }
  }, [notification])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        {/* Skeleton Hero */}
        <div className="px-4 pt-12 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-3">
              <div className="h-8 w-32 bg-amber-200/50 rounded-lg animate-pulse" />
              <div className="h-4 w-20 bg-amber-200/30 rounded animate-pulse" />
            </div>
            <div className="w-12 h-12 bg-amber-200/30 rounded-full animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-12 bg-amber-200/30 rounded-2xl animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 w-20 bg-amber-200/30 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Skeleton Menu */}
        <div className="px-4 space-y-6">
          {[1, 2].map(cat => (
            <div key={cat}>
              <div className="h-6 w-24 bg-gray-200/50 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map(item => (
                  <div key={item} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#DC2626" strokeWidth="2">
              <circle cx="16" cy="16" r="14"/>
              <path d="M12 12l8 8M20 12l-8 8" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">Unable to Load Menu</h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const totalItems = allMenuItems.length
  const availableItems = allMenuItems.filter(i => i.is_available).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pb-24">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 left-4 right-4 z-[70] max-w-md mx-auto animate-in slide-in-from-top duration-300">
          <div className="rounded-2xl bg-gray-900 text-white px-5 py-3.5 text-sm text-center shadow-2xl flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8" cy="8" r="7"/>
              <path d="M5 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {notification}
          </div>
        </div>
      )}

      {/* ─── Section 1: Restaurant Header ─── */}
      <div className="sticky top-0 z-40 bg-amber-50/95 backdrop-blur-md border-b border-amber-100/50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {restaurant?.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-serif font-bold text-lg shadow-lg shadow-amber-200/50">
                {restaurant?.name?.charAt(0) || 'R'}
              </div>
            )}
            <div>
              <h1 className="font-serif text-lg font-bold text-gray-900 leading-tight">
                {restaurant?.name || 'Restaurant'}
              </h1>
              {tableId && (
                <p className="text-xs text-amber-600 font-medium">Table {tableId}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Live Connection Indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isConnected
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {isConnected ? 'Live' : 'Offline'}
            </div>
            <Link
              href={`/menu/${slug}/order-history`}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-amber-600 hover:border-amber-300 transition-all duration-200 shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="9" r="8"/>
                <path d="M9 5v5l3 1.5" strokeLinecap="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Section 2: Hero Section ─── */}
      <div className="relative px-4 pt-8 pb-6 overflow-hidden">
        {restaurant?.cover_image_url && (
          <div className="absolute inset-0 z-0">
            <img
              src={restaurant.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-amber-50/80 via-amber-50/95 to-amber-50" />
          </div>
        )}
        <div className="relative z-10">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="font-serif text-3xl font-bold text-gray-900 tracking-tight">
                Our Menu
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {availableItems} of {totalItems} dishes available
              </p>
            </div>
            {Object.keys(eightySixedItems).length > 0 && (
              <span className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200">
                {Object.keys(eightySixedItems).length} 86&apos;d
              </span>
            )}
          </div>

          {/* Quick Links */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link
              href={`/menu/${slug}/queue`}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors whitespace-nowrap shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 4v4M7 10v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Join Waitlist
            </Link>
            <Link
              href={`/menu/${slug}/reserve`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M1 5h12M4 1v2M10 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Reserve Table
            </Link>
            <Link
              href={`/menu/${slug}/favorites`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 12s-5-3.5-5-6.5a3 3 0 015-2 3 3 0 015 2c0 3-5 6.5-5 6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              Favorites
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Section 3: Search Bar & Filters ─── */}
      <div className="sticky top-[60px] z-30 bg-amber-50/95 backdrop-blur-md px-4 py-3 border-b border-amber-100/50">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              activeFilters.length > 0
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-200/50'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300 shadow-sm'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 2h12M3 7h8M5 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {activeFilters.length > 0 ? activeFilters.length : ''}
          </button>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-600 outline-none focus:border-amber-400 shadow-sm"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Filter Tags */}
        {showFilters && (
          <div className="flex flex-wrap gap-1.5 mt-3 animate-in slide-in-from-top duration-200">
            {DIETARY_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleFilter(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  activeFilters.includes(tag)
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-200/50'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700'
                }`}
              >
                {tag.replace('_', ' ')}
              </button>
            ))}
            {activeFilters.length > 0 && (
              <button
                onClick={() => setActiveFilters([])}
                className="px-3 py-1.5 text-xs text-amber-700 hover:text-amber-800 font-semibold underline"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Section 4: Category Navigation ─── */}
      {categories.length > 0 && !searchQuery && activeFilters.length === 0 && (
        <div className="sticky top-[120px] z-20 bg-amber-50/95 backdrop-blur-md border-b border-amber-100/50">
          <div
            ref={categoryNavRef}
            className="flex gap-1 px-4 py-2.5 overflow-x-auto scrollbar-hide"
          >
            <button
              onClick={() => scrollToCategory('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeCategory === 'all'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Section 5: Today's Specials ─── */}
      {recommendations.length > 0 && searchQuery === '' && activeFilters.length === 0 && (
        <section className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <h2 className="font-serif text-xl font-bold text-gray-900">Today&apos;s Specials</h2>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {recommendations.slice(0, 5).map(item => (
              <div
                key={item.id}
                className="flex-shrink-0 w-[280px]"
                onClick={() => handleItemClick(item)}
              >
                <MenuItemCard
                  item={item}
                  onAddToCart={handleAddToCart}
                  is86ed={!!eightySixedItems[item.id]}
                  isLast86ed={!!lastEightySixItems[item.id]}
                  onClick={() => handleItemClick(item)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Section 6-16: Menu Content ─── */}
      {searchQuery || activeFilters.length > 0 ? (
        /* Search Results */
        <section className="px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              {sortedItems.length} result{sortedItems.length !== 1 ? 's' : ''}
            </h2>
            <button
              onClick={() => { setSearchQuery(''); setActiveFilters([]) }}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold underline"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sortedItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAddToCart={handleAddToCart}
                is86ed={!!eightySixedItems[item.id]}
                isLast86ed={!!lastEightySixItems[item.id]}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
          {sortedItems.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">🔍</span>
              <p className="text-gray-500 font-medium">No dishes match your search</p>
              <p className="text-gray-400 text-sm mt-1">Try different keywords or filters</p>
            </div>
          )}
        </section>
      ) : (
        /* Categories */
        categories.map(category => (
          <section
            key={category.id}
            ref={(el) => { if (el) categoryRefs.current.set(category.id, el) }}
            data-category-id={category.id}
            className="px-4 pt-6 pb-2"
          >
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-serif text-2xl font-bold text-gray-900 tracking-tight">
                {category.name}
              </h2>
              <span className="text-xs text-gray-400 font-medium">
                {category.items.length} item{category.items.length !== 1 ? 's' : ''}
              </span>
            </div>
            {category.description && (
              <p className="text-sm text-gray-500 mb-4">{category.description}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {category.items.map(item => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={handleAddToCart}
                  is86ed={!!eightySixedItems[item.id]}
                  isLast86ed={!!lastEightySixItems[item.id]}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {/* ─── Section 17: Restaurant Info ─── */}
      <section className="px-4 pt-8 pb-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#D97706" strokeWidth="1.5">
              <circle cx="9" cy="9" r="8"/>
              <path d="M9 5v4M9 12v.01" strokeLinecap="round"/>
            </svg>
            <h3 className="font-serif text-lg font-bold text-gray-900">About Us</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            {restaurant?.address && (
              <div className="flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-0.5 flex-shrink-0">
                  <path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5z"/>
                  <circle cx="8" cy="6" r="2"/>
                </svg>
                <span>{restaurant.address}</span>
              </div>
            )}
            {restaurant?.phone && (
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0">
                  <path d="M14.5 11.4v2a1 1 0 01-1.1 1 10.9 10.9 0 01-4.8-1.7 10.7 10.7 0 01-3.3-3.3A10.9 10.9 0 01.6 3.6 1 1 0 011.6 2.5h2a1 1 0 011 .8c.2.9.5 1.8.8 2.6a1 1 0 01-.2 1L4.3 7.8a8.7 8.7 0 003.9 3.9l1.2-1.2a1 1 0 011-.3c.8.3 1.7.5 2.6.6a1 1 0 01.5 1.3z"/>
                </svg>
                <a href={`tel:${restaurant.phone}`} className="hover:text-amber-600 transition-colors">
                  {restaurant.phone}
                </a>
              </div>
            )}
            {restaurant?.email && (
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0">
                  <rect x="1" y="3" width="14" height="10" rx="2"/>
                  <path d="M1 5l7 4 7-4"/>
                </svg>
                <a href={`mailto:${restaurant.email}`} className="hover:text-amber-600 transition-colors">
                  {restaurant.email}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Section 18: Footer ─── */}
      <footer className="px-4 pt-4 pb-8 border-t border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-semibold text-amber-600">KitchenSync</span>
          </p>
          <p className="text-[10px] text-gray-300 mt-1">
            Real-time restaurant management platform
          </p>
        </div>
      </footer>

      {/* ─── Dish Detail Modal ─── */}
      <DishDetailModal
        item={selectedItem}
        isOpen={showDishDetail}
        onClose={() => { setShowDishDetail(false); setSelectedItem(null) }}
        onAddToCart={handleAddToCart}
      />

      {/* ─── Cart Bar ─── */}
      <CartBar
        onSubmitOrder={handleSubmitOrder}
        taxRate={restaurant?.tax_rate || 0.08}
        serviceChargeRate={restaurant?.service_charge_rate || 0.10}
      />
    </div>
  )
}
