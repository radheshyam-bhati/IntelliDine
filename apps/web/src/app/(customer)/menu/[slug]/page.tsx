'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { MenuCategory, MenuItem } from '@kitchensync/shared'
import MenuItemCard from '@/components/MenuItemCard'
import CartBar from '@/components/CartBar'
import { useCart } from '@/lib/cart-context'
import { connect } from '@/lib/socket'

type MenuItemWithOrders = MenuItem & { order_count?: number }

const DIETARY_TAGS = ['vegetarian', 'vegan', 'gluten-free', 'keto', 'halal', 'dairy-free', 'nut-free']
const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
]

export default function CustomerMenuPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const tableId = searchParams.get('table') || undefined

  const [categories, setCategories] = useState<(MenuCategory & { items: MenuItem[] })[]>([])
  const [recommendations, setRecommendations] = useState<MenuItemWithOrders[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)
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
          if (menuData.success) {
            setCategories(menuData.data)
          } else setError(menuData.error || 'Failed to load menu')
          if (recData.success) setRecommendations(recData.data || [])
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Network error')
      } finally { if (!cancelled) setLoading(false) }
    }
    fetchMenu()
    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    const socket = connect(slug, '', slug)
    socket.on('menu:availability', (updatedItem: MenuItem) => {
      setCategories(prev => prev.map(cat => ({ ...cat, items: cat.items.map(item => item.id === updatedItem.id ? updatedItem : item) })))
    })
    return () => { socket.disconnect() }
  }, [slug])

  const toggleFilter = (tag: string) => {
    setActiveFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const allMenuItems = categories.flatMap(c => c.items)
  const filteredItems = allMenuItems.filter(item => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (activeFilters.length > 0 && !activeFilters.every(f => item.dietary_tags.includes(f))) return false
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

  const handleSubmitOrder = useCallback(async () => {
    const unavailableItems = items.filter(i => !i.menuItem.is_available)
    if (unavailableItems.length > 0) {
      setNotification(`Some items are no longer available: ${unavailableItems.map(i => i.menuItem.name).join(', ')}`)
      return
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantSlug: slug, tableId, items: items.map(i => ({ menuItemId: i.menuItem.id, quantity: i.quantity, unitPrice: i.menuItem.price })) }),
      })
      const data = await res.json()
      if (data.success) {
        const orderId = data.data?.id
        clearCart()
        if (orderId) router.push(`/menu/${slug}/order/${orderId}`)
        else setNotification('Order placed successfully!')
      } else setNotification(data.error || 'Failed to place order')
    } catch (err) {
      setNotification(err instanceof Error ? err.message : 'Failed to place order')
    }
  }, [items, slug, tableId, clearCart])

  useEffect(() => { if (notification) { const t = setTimeout(() => setNotification(null), 5000); return () => clearTimeout(t) } }, [notification])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-gray-400 text-lg animate-pulse">Loading menu...</div></div>
  if (error) return <div className="flex items-center justify-center min-h-[60vh] px-4"><div className="text-center"><p className="text-red-500 text-lg mb-2">Unable to load menu</p><p className="text-gray-400 text-sm">{error}</p></div></div>

  return (
    <div className="pb-24">
      {notification && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-2xl mx-auto">
          <div className="rounded-lg bg-gray-900 text-white px-4 py-3 text-sm text-center shadow-lg">{notification}</div>
        </div>
      )}

      {/* Hero */}
      <div className="relative px-4 pt-10 pb-8 bg-gradient-to-b from-amber-50 to-amber-50/0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl text-gray-900 tracking-tight">Menu</h1>
            {tableId && <p className="mt-1 text-sm text-amber-700 font-medium">Table {tableId}</p>}
          </div>
        </div>
        <div className="h-px bg-amber-200/60 mt-4" />
        <div className="flex flex-wrap gap-2 mt-4">
          <Link href={`/menu/${slug}/queue`} className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M7 4v4M7 10v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Join Waitlist
          </Link>
          <Link href={`/menu/${slug}/reserve`} className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 5h12M4 1v2M10 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Make a Reservation
          </Link>
          <Link href={`/menu/${slug}/order-history`} className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M7 4v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            My Orders
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="sticky top-0 z-30 bg-amber-50/95 backdrop-blur-sm px-4 py-3 border-b border-amber-100">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search menu items..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-hidden transition-all" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`min-touch flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              activeFilters.length > 0 ? 'bg-amber-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 2h12M3 7h8M5 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Filters{activeFilters.length > 0 && ` (${activeFilters.length})`}
          </button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-600 outline-hidden focus:border-amber-400">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {DIETARY_TAGS.map(tag => (
              <button key={tag} onClick={() => toggleFilter(tag)}
                className={`min-touch rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeFilters.includes(tag)
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300'
                }`}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </button>
            ))}
            {activeFilters.length > 0 && (
              <button onClick={() => setActiveFilters([])} className="min-touch text-xs text-amber-700 hover:text-amber-800 underline ml-1">Clear</button>
            )}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && searchQuery === '' && activeFilters.length === 0 && (
        <section className="mb-8">
          <div className="px-4 mb-4 pt-4">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl text-amber-800">Popular</h2>
              <div className="flex-1 h-px bg-amber-200/60" />
            </div>
            <p className="text-xs text-amber-600/70 mt-1">Guest favorites</p>
          </div>
          <div className="px-4 space-y-3">
            {recommendations.map(item => (
              <div key={item.id} className="relative">
                {item.order_count && item.order_count >= 10 && (
                  <span className="absolute -top-1 -right-1 z-10 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">Hot</span>
                )}
                <MenuItemCard item={item} onAddToCart={() => { if (item.is_available) addItem(item) }}
                  expanded={expandedItem === item.id} onToggleExpand={() => setExpandedItem(expandedItem === item.id ? null : item.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search results */}
      {searchQuery || activeFilters.length > 0 ? (
        <section className="px-4 pt-4">
          <h2 className="font-serif text-xl text-gray-700 mb-4">
            {sortedItems.length} result{sortedItems.length !== 1 ? 's' : ''}
            {(searchQuery || activeFilters.length > 0) && (
              <button onClick={() => { setSearchQuery(''); setActiveFilters([]) }} className="ml-3 text-xs text-amber-700 underline font-sans">Clear all</button>
            )}
          </h2>
          <div className="space-y-3">
            {sortedItems.map(item => (
              <MenuItemCard key={item.id} item={item} onAddToCart={() => { if (item.is_available) addItem(item) }}
                expanded={expandedItem === item.id} onToggleExpand={() => setExpandedItem(expandedItem === item.id ? null : item.id)} />
            ))}
            {sortedItems.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No items match your criteria</p>}
          </div>
        </section>
      ) : (
        /* Menu by category */
        categories.map(category => (
          <section key={category.id} className="mb-8">
            <div className="px-4 mb-4 pt-4">
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-3xl text-gray-800 tracking-tight">{category.name}</h2>
                <div className="flex-1 h-px bg-amber-200/40" />
              </div>
              {category.description && <p className="text-xs text-gray-500 mt-1 ml-0.5">{category.description}</p>}
            </div>
            <div className="px-4 space-y-3">
              {category.items.map(item => (
                <MenuItemCard key={item.id} item={item} onAddToCart={() => { if (item.is_available) addItem(item) }}
                  expanded={expandedItem === item.id} onToggleExpand={() => setExpandedItem(expandedItem === item.id ? null : item.id)} />
              ))}
            </div>
          </section>
        ))
      )}

      <CartBar onSubmitOrder={handleSubmitOrder} />
    </div>
  )
}
