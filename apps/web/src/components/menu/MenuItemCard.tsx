'use client'

import { useState, useEffect, useRef } from 'react'
import type { MenuItem } from '@kitchensync/shared'

interface MenuItemCardProps {
  item: MenuItem
  onAddToCart: (item: MenuItem, quantity: number, specialRequest?: string) => void
  isLast86ed?: boolean
  is86ed?: boolean
  onClick?: () => void
  currency?: string
}

function getDietaryIcon(tag: string): string {
  const icons: Record<string, string> = {
    vegetarian: '🌱',
    vegan: '🌿',
    gluten_free: '🌾',
    dairy_free: '🥛',
    nut_free: '🥜',
    spicy: '🌶️',
    organic: '🌿',
    halal: '🍖',
    kosher: '✡️',
  }
  return icons[tag.toLowerCase()] || ''
}

function getSpiceLevel(level: number | null): string {
  if (!level || level === 0) return ''
  return '🌶️'.repeat(level)
}

function getTimeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function MenuItemCard({
  item,
  onAddToCart,
  isLast86ed = false,
  is86ed = false,
  onClick,
  currency = '$',
}: MenuItemCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [quickAddQty, setQuickAddQty] = useState(0)
  const [specialRequest, setSpecialRequest] = useState('')
  const [showSpecialInput, setShowSpecialInput] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const specialInputRef = useRef<HTMLInputElement>(null)

  const isAvailable = item.is_available && !is86ed
  const showUnavailableOverlay = !isAvailable
  const showQuickAdd = quickAddQty > 0 && isAvailable

  useEffect(() => {
    if (showSpecialInput && specialInputRef.current) {
      specialInputRef.current.focus()
    }
  }, [showSpecialInput])

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAvailable) return
    setQuickAddQty(1)
    onAddToCart(item, 1)
  }

  const handleQuickAdd = (delta: number) => {
    const newQty = quickAddQty + delta
    if (newQty <= 0) {
      setQuickAddQty(0)
      return
    }
    setQuickAddQty(newQty)
    onAddToCart(item, delta)
  }

  const handleSpecialSubmit = () => {
    if (specialRequest.trim()) {
      onAddToCart(item, 1, specialRequest.trim())
      setSpecialRequest('')
      setShowSpecialInput(false)
    }
  }

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden ${
        isAvailable
          ? 'border-gray-100 bg-white hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50 cursor-pointer'
          : 'border-gray-100 bg-gray-50/50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Image Section */}
      {item.image_url && (
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite]" />
            </div>
          )}
          {!imageError && (
            <img
              src={item.image_url}
              alt={item.name}
              className={`w-full h-full object-cover transition-all duration-500 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              } ${isHovered && isAvailable ? 'scale-105' : ''}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          )}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="text-center">
                <span className="text-4xl">🍽️</span>
                <p className="text-xs text-amber-600 mt-1 font-medium">{item.name}</p>
              </div>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {item.is_signature && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M5 0l1.18 2.39L9 2.76l-2 1.95.47 2.75L5 6.03 2.53 7.46 3 4.71 1 2.76l2.82-.37z"/>
                </svg>
                Signature
              </span>
            )}
            {isLast86ed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
                Last 86
              </span>
            )}
            {item.calories && item.calories > 0 && (
              <span className="px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm">
                {item.calories} cal
              </span>
            )}
          </div>

          {/* Price Badge */}
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1.5 rounded-full bg-white/95 text-gray-900 text-sm font-bold shadow-lg backdrop-blur-sm">
              {currency}{item.price.toFixed(2)}
            </span>
          </div>

          {/* Unavailable Overlay */}
          {showUnavailableOverlay && (
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 text-gray-900 font-bold text-sm shadow-xl">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-red-500">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="2"/>
                    <path d="M4 7h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  86&apos;d
                </div>
                {isLast86ed && (
                  <p className="mt-2 text-white/90 text-xs font-medium">Last one available — just sold out</p>
                )}
                {!isLast86ed && (
                  <p className="mt-2 text-white/90 text-xs font-medium">Temporarily unavailable</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-4">
        {/* Header with name and price (for non-image cards) */}
        {!item.image_url && (
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {item.is_signature && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider">
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M5 0l1.18 2.39L9 2.76l-2 1.95.47 2.75L5 6.03 2.53 7.46 3 4.71 1 2.76l2.82-.37z"/>
                    </svg>
                    Signature
                  </span>
                )}
                {isLast86ed && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider">
                    Last 86
                  </span>
                )}
              </div>
            </div>
            <span className={`text-lg font-bold ${isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
              {currency}{item.price.toFixed(2)}
            </span>
          </div>
        )}

        {/* Name (for image cards, show below image) */}
        {item.image_url && (
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-serif text-lg leading-tight font-semibold ${
              isAvailable ? 'text-gray-900' : 'text-gray-400'
            }`}>
              {item.name}
            </h3>
            <span className={`text-lg font-bold flex-shrink-0 ${isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
              {currency}{item.price.toFixed(2)}
            </span>
          </div>
        )}

        {!item.image_url && (
          <h3 className={`font-serif text-lg leading-tight font-semibold mb-1 ${
            isAvailable ? 'text-gray-900' : 'text-gray-400'
          }`}>
            {item.name}
          </h3>
        )}

        {/* Description */}
        <p className={`text-sm leading-relaxed line-clamp-2 ${
          isAvailable ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {item.description || 'No description available'}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {/* Spice Level */}
          {item.spice_level && item.spice_level > 0 && (
            <span className="text-sm" title={`Spice level: ${item.spice_level}/5`}>
              {getSpiceLevel(item.spice_level)}
            </span>
          )}

          {/* Preparation Time */}
          {item.preparation_time && (
            <span className={`inline-flex items-center gap-1 text-xs ${isAvailable ? 'text-gray-400' : 'text-gray-400'}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="6" cy="6" r="5"/>
                <path d="M6 3v3l2 1" strokeLinecap="round"/>
              </svg>
              {item.preparation_time}min
            </span>
          )}

          {/* Cost Price (if available and different) */}
          {'cost_price' in item && (item as MenuItem & { cost_price: number | null }).cost_price && (item as MenuItem & { cost_price: number | null }).cost_price !== item.price && (
            <span className={`inline-flex items-center gap-1 text-xs ${isAvailable ? 'text-gray-400' : 'text-gray-400'}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="6" cy="6" r="5"/>
                <path d="M6 3v6M4.5 5h3M4.5 7h3" strokeLinecap="round"/>
              </svg>
              Value
            </span>
          )}
        </div>

        {/* Dietary Tags */}
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.dietary_tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                  isAvailable
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
              >
                {getDietaryIcon(tag) && <span className="text-xs">{getDietaryIcon(tag)}</span>}
                {tag.replace('_', ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Add to Cart / Quick Add Controls */}
        {isAvailable && (
          <div className="mt-4">
            {!showQuickAdd ? (
              <div className="flex gap-2">
                <button
                  onClick={handleAddClick}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 active:bg-amber-700 transition-all duration-200 hover:shadow-lg hover:shadow-amber-200/50 active:scale-[0.98]"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M7 3v8M3 7h8"/>
                  </svg>
                  Add to Cart
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSpecialInput(true)
                  }}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
                  title="Add with special request"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M11 1.5l1.5 1.5-9 9H2v-1.5l9-9zM11 1.5l1.5 1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleQuickAdd(-1)
                  }}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all duration-200 active:scale-95"
                >
                  <svg width="12" height="2" viewBox="0 0 12 2" fill="none">
                    <path d="M1 1h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <span className="w-10 text-center text-lg font-bold text-gray-900 tabular-nums">
                  {quickAddQty}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleQuickAdd(1)
                  }}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-all duration-200 active:scale-95 shadow-lg shadow-amber-200/50"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setQuickAddQty(0)
                  }}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-red-500 transition-all duration-200"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Special Request Input */}
            {showSpecialInput && (
              <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={specialInputRef}
                  type="text"
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSpecialSubmit()}
                  placeholder="No onions, extra spicy, etc."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
                />
                <button
                  onClick={handleSpecialSubmit}
                  className="px-3 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}

        {/* Unavailable State */}
        {!isAvailable && (
          <div className="mt-4 flex items-center gap-2 text-gray-400">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="6"/>
              <path d="M4 7h6" strokeLinecap="round"/>
            </svg>
            <span className="text-sm font-medium">86&apos;d — temporarily unavailable</span>
          </div>
        )}

        {/* Last 86 Time */}
        {isLast86ed && 'updated_at' in item && (
          <p className="mt-2 text-xs text-gray-400">
            Last available {getTimeAgo((item as MenuItem & { updated_at: string }).updated_at)}
          </p>
        )}
      </div>
    </div>
  )
}
