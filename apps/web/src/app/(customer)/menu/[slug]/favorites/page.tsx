'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { CustomerFavorite, MenuItem, LoyaltyPoint, CustomerReward, Reward, Wallet } from '@kitchensync/shared'
import MenuItemCard from '@/components/MenuItemCard'
import CartBar from '@/components/CartBar'
import { useCart } from '@/lib/cart-context'

export default function FavoritesLoyaltyPage() {
  const params = useParams()
  const slug = params.slug as string
  const { addItem, items, clearCart } = useCart()

  const [favoriteItems, setFavoriteItems] = useState<(CustomerFavorite & { menuItem?: MenuItem })[]>([])
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoint[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [customerRewards, setCustomerRewards] = useState<(CustomerReward & { reward?: Reward })[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'favorites' | 'loyalty' | 'rewards'>('favorites')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

        const results = await Promise.allSettled([
          fetch(`${api}/customers/favorites`).then(r => r.json()),
          fetch(`${api}/customers/loyalty/points`).then(r => r.json()),
          fetch(`${api}/rewards`).then(r => r.json()),
          fetch(`${api}/customers/loyalty/rewards`).then(r => r.json()),
          fetch(`${api}/customers/wallet`).then(r => r.json()),
        ])

        if (results[0].status === 'fulfilled' && results[0].value.success) setFavoriteItems(results[0].value.data || [])
        if (results[1].status === 'fulfilled' && results[1].value.success) setLoyaltyPoints(results[1].value.data || [])
        if (results[2].status === 'fulfilled' && results[2].value.success) setRewards(results[2].value.data || [])
        if (results[3].status === 'fulfilled' && results[3].value.success) setCustomerRewards(results[3].value.data || [])
        if (results[4].status === 'fulfilled' && results[4].value.success) setWallet(results[4].value.data)
      } finally { setLoading(false) }
    }
    fetchData()
  }, [slug])

  const toggleFavorite = async (menuItemId: string) => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

    if (favoriteItems.some(f => f.menu_item_id === menuItemId)) {
      const existing = favoriteItems.find(f => f.menu_item_id === menuItemId)!
      const res = await fetch(`${api}/customers/favorites/${existing.id}`, { method: 'DELETE' })
      if (res.ok) setFavoriteItems(prev => prev.filter(f => f.id !== existing.id))
    } else {
      const res = await fetch(`${api}/customers/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu_item_id: menuItemId }),
      })
      const data = await res.json()
      if (data.success) {
        // Refetch all favorites to get populated menuItem data
        const refreshed = await fetch(`${api}/customers/favorites`)
        const refreshedData = await refreshed.json()
        if (refreshedData.success) setFavoriteItems(refreshedData.data || [])
      }
    }
  }

  const redeemReward = async (rewardId: string) => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
    try {
      const res = await fetch(`${api}/customers/loyalty/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward_id: rewardId }),
      })
      const data = await res.json()
      if (data.success) {
        setNotification('Reward redeemed successfully! Check your rewards tab.')
        const pointsResults = await Promise.allSettled([
          fetch(`${api}/customers/loyalty/points`).then(r => r.json()),
          fetch(`${api}/customers/loyalty/rewards`).then(r => r.json()),
        ])
        if (pointsResults[0].status === 'fulfilled' && pointsResults[0].value.success) setLoyaltyPoints(pointsResults[0].value.data || [])
        if (pointsResults[1].status === 'fulfilled' && pointsResults[1].value.success) setCustomerRewards(pointsResults[1].value.data || [])
      } else {
        setNotification(data.error || 'Failed to redeem reward')
      }
    } catch {
      setNotification('Network error while redeeming reward')
    }
    setTimeout(() => setNotification(null), 4000)
  }

  const totalPoints = loyaltyPoints
    .filter(p => p.type === 'earned' || p.type === 'bonus')
    .reduce((sum, p) => sum + p.points, 0)
  const redeemedPoints = loyaltyPoints
    .filter(p => p.type === 'redeemed')
    .reduce((sum, p) => sum + p.points, 0)
  const availablePoints = totalPoints - redeemedPoints

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="pb-8">
      {notification && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-2xl mx-auto">
          <div className="rounded-lg bg-gray-900 text-white px-4 py-3 text-sm text-center shadow-lg">
            {notification}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-10 pb-6 bg-gradient-to-b from-amber-50 to-amber-50/0">
        <Link href={`/menu/${slug}`} className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 mb-4">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to Menu
        </Link>
        <h1 className="font-serif text-3xl text-gray-900 tracking-tight">My Things</h1>
        <p className="text-sm text-gray-500 mt-1">Your favorites, loyalty, and rewards</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-amber-100 px-4">
        {(['favorites', 'loyalty', 'rewards'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`min-touch px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            {tab === 'favorites' && '❤️ Favorites'}
            {tab === 'loyalty' && '⭐ Loyalty'}
            {tab === 'rewards' && '🎁 Rewards'}
          </button>
        ))}
      </div>

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <div className="px-4 pt-6 space-y-3">
          {favoriteItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">❤️</p>
              <p className="text-gray-500 text-sm">No favorites yet</p>
              <p className="text-gray-400 text-xs mt-1">Tap the heart on menu items to save them here</p>
              <Link href={`/menu/${slug}`}
                className="inline-block mt-4 rounded-lg bg-amber-600 text-white px-5 py-2 text-sm font-medium hover:bg-amber-700 transition-colors">
                Browse Menu
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500">{favoriteItems.length} favorite item{favoriteItems.length !== 1 ? 's' : ''}</p>
              {favoriteItems.map(fav => fav.menuItem && (
                <div key={fav.id} className="relative">
                  <button onClick={() => toggleFavorite(fav.menu_item_id)}
                    className="absolute top-2 right-2 z-10 text-red-500 hover:text-red-600 transition-colors"
                    aria-label="Remove from favorites">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                  </button>
                  <MenuItemCard item={fav.menuItem}
                    onAddToCart={() => addItem(fav.menuItem!)}
                    expanded={expandedItem === fav.id}
                    onToggleExpand={() => setExpandedItem(expandedItem === fav.id ? null : fav.id)} />
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Loyalty Tab */}
      {activeTab === 'loyalty' && (
        <div className="px-4 pt-6 space-y-6">
          {/* Points Card */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/80">Your Points</p>
              <span className="text-2xl">⭐</span>
            </div>
            <p className="text-4xl font-bold tracking-tight">{availablePoints.toLocaleString()}</p>
            <p className="text-sm text-white/70 mt-1">available to redeem</p>

            <div className="mt-4 flex gap-4 text-sm">
              <div>
                <p className="text-white/60 text-xs">Earned</p>
                <p className="font-semibold">{totalPoints.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Redeemed</p>
                <p className="font-semibold">{redeemedPoints.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Rewards</p>
                <p className="font-semibold">{customerRewards.filter(r => r.status === 'active').length}</p>
              </div>
            </div>
          </div>

          {/* How to earn */}
          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Earn Points</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">$1</span>
                <span>Spend $1 = 1 point</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">🎂</span>
                <span>Double points on your birthday</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">★</span>
                <span>Leave a review = 25 bonus points</span>
              </div>
            </div>
          </div>

          {/* Points History */}
          {loyaltyPoints.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity</h3>
              <div className="space-y-2">
                {loyaltyPoints.slice(0, 10).map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-white border border-gray-100 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${p.type === 'earned' || p.type === 'bonus' ? '' : 'opacity-50'}`}>
                        {p.type === 'earned' ? '➕' : p.type === 'redeemed' ? '➖' : p.type === 'bonus' ? '🎉' : '⏰'}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-gray-700 capitalize">{p.type}</p>
                        <p className="text-[10px] text-gray-400">
                          {p.reference || 'General'}
                          {p.expires_at && ` · Expires ${new Date(p.expires_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${p.type === 'earned' || p.type === 'bonus' ? 'text-green-600' : 'text-red-500'}`}>
                      {p.type === 'earned' || p.type === 'bonus' ? '+' : '-'}{p.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="px-4 pt-6 space-y-6">
          {/* Wallet */}
          {wallet && (
            <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white shadow">
              <p className="text-xs text-white/70">Wallet Balance</p>
              <p className="text-2xl font-bold mt-0.5">${wallet.balance.toFixed(2)}</p>
            </div>
          )}

          {/* Available Rewards to Redeem */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Rewards</h3>
            {rewards.filter(r => r.is_active).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No rewards available right now</p>
            ) : (
              <div className="space-y-3">
                {rewards.filter(r => r.is_active).map(reward => {
                  const canRedeem = availablePoints >= reward.points_required
                  return (
                    <div key={reward.id} className={`rounded-xl border p-4 ${
                      canRedeem ? 'border-amber-200 bg-white' : 'border-gray-100 bg-gray-50'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {reward.reward_type === 'discount' ? '🏷️' : reward.reward_type === 'free_item' ? '🎁' : reward.reward_type === 'free_delivery' ? '🚚' : '💳'}
                            </span>
                            <p className="text-sm font-semibold text-gray-900 truncate">{reward.name}</p>
                          </div>
                          {reward.description && <p className="text-xs text-gray-500 mt-1 ml-7">{reward.description}</p>}
                          <div className="flex items-center gap-2 mt-2 ml-7">
                            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-medium">
                              ⭐ {reward.points_required} pts
                            </span>
                            {reward.discount_percent && (
                              <span className="text-[10px] text-gray-400">{reward.discount_percent}% off</span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => redeemReward(reward.id)} disabled={!canRedeem}
                          className={`min-touch rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                            canRedeem
                              ? 'bg-amber-600 text-white hover:bg-amber-700'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}>
                          {canRedeem ? 'Redeem' : `${reward.points_required - availablePoints} more pts`}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* My Rewards (already redeemed) */}
          {customerRewards.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">My Rewards</h3>
              <div className="space-y-2">
                {customerRewards.map(cr => (
                  <div key={cr.id} className="rounded-lg border border-gray-100 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cr.reward?.name || 'Reward'}</p>
                        <p className="text-xs text-gray-500">
                          Status: <span className={`font-medium ${cr.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>{cr.status}</span>
                          {cr.expires_at && ` · Expires ${new Date(cr.expires_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">{cr.points_used} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <CartBar onSubmitOrder={async () => {
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
        try {
          const res = await fetch(`${api}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ restaurantSlug: slug, items: items.map(i => ({ menuItemId: i.menuItem.id, quantity: i.quantity, unitPrice: i.menuItem.price })) }),
          })
          const data = await res.json()
          if (data.success) {
            clearCart()
            window.location.href = `/menu/${slug}`
          } else {
            setNotification(data.error || 'Failed to place order')
          }
        } catch (err) {
          setNotification(err instanceof Error ? err.message : 'Failed to place order')
        }
      }} />
    </div>
  )
}
