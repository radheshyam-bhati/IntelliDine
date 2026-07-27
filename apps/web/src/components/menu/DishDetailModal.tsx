'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MenuItem } from '@kitchensync/shared'

interface DishDetailModalProps {
  item: MenuItem | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (item: MenuItem, quantity: number, specialRequest?: string) => void
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

function getSpiceLevel(level: number | null): { label: string; color: string } {
  if (!level || level === 0) return { label: 'None', color: 'text-gray-400' }
  if (level === 1) return { label: 'Mild', color: 'text-green-600' }
  if (level === 2) return { label: 'Medium', color: 'text-yellow-600' }
  if (level === 3) return { label: 'Hot', color: 'text-orange-600' }
  return { label: 'Very Hot', color: 'text-red-600' }
}

export default function DishDetailModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
  currency = '$',
}: DishDetailModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [specialRequest, setSpecialRequest] = useState('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const handleClose = useCallback(() => {
    onClose()
    setQuantity(1)
    setSpecialRequest('')
    setActiveImageIndex(0)
  }, [onClose])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleClose])

  useEffect(() => {
    setQuantity(1)
    setSpecialRequest('')
    setActiveImageIndex(0)
  }, [item])

  if (!item || !isOpen) return null

  const spice = getSpiceLevel(item.spice_level)
  const totalPrice = item.price * quantity

  const handleAddToCart = () => {
    onAddToCart(item, quantity, specialRequest.trim() || undefined)
    handleClose()
  }

  const allergens = item.allergen_info
    ? item.allergen_info.split(',').map((a) => a.trim()).filter(Boolean)
    : []

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white transition-all duration-200 shadow-lg"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4l10 10M14 4L4 14"/>
          </svg>
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* Image Gallery */}
          {item.image_url && (
            <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {item.is_signature && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                    <svg width="12" height="12" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M5 0l1.18 2.39L9 2.76l-2 1.95.47 2.75L5 6.03 2.53 7.46 3 4.71 1 2.76l2.82-.37z"/>
                    </svg>
                    Signature Dish
                  </span>
                )}
                {item.calories && item.calories > 0 && (
                  <span className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                    {item.calories} calories
                  </span>
                )}
              </div>

              {/* Price Tag */}
              <div className="absolute bottom-4 right-4">
                <span className="px-4 py-2 rounded-2xl bg-white/95 text-gray-900 text-xl font-bold shadow-xl backdrop-blur-sm">
                  {currency}{item.price.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h2 className="font-serif text-2xl font-bold text-gray-900">{item.name}</h2>
                {!item.image_url && (
                  <span className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-lg font-bold">
                    {currency}{item.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-gray-600 leading-relaxed mb-6">{item.description}</p>
            )}

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Preparation Time */}
              {item.preparation_time && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#3B82F6" strokeWidth="2">
                      <circle cx="9" cy="9" r="8"/>
                      <path d="M9 5v4l2.5 1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Prep Time</p>
                    <p className="text-sm font-semibold text-gray-900">{item.preparation_time} min</p>
                  </div>
                </div>
              )}

              {/* Spice Level */}
              {item.spice_level && item.spice_level > 0 && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-lg">🌶️</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Spice Level</p>
                    <p className={`text-sm font-semibold ${spice.color}`}>
                      {'🌶️'.repeat(item.spice_level)} {spice.label}
                    </p>
                  </div>
                </div>
              )}

              {/* Calories */}
              {item.calories && item.calories > 0 && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F97316" strokeWidth="2">
                      <path d="M9 2C5 6 3 9 3 12a6 6 0 0012 0c0-3-2-6-6-10z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Calories</p>
                    <p className="text-sm font-semibold text-gray-900">{item.calories} kcal</p>
                  </div>
                </div>
              )}

              {/* Allergen Info */}
              {item.allergen_info && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#EAB308" strokeWidth="2">
                      <path d="M9 2l7 13H2L9 2z"/>
                      <path d="M9 8v3M9 13v.01" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Allergens</p>
                    <p className="text-sm font-semibold text-gray-900">{item.allergen_info}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Dietary Tags */}
            {item.dietary_tags && item.dietary_tags.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dietary Info</h4>
                <div className="flex flex-wrap gap-2">
                  {item.dietary_tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium border border-green-200"
                    >
                      {getDietaryIcon(tag) && <span>{getDietaryIcon(tag)}</span>}
                      {tag.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Allergens */}
            {allergens.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Allergens</h4>
                <div className="flex flex-wrap gap-2">
                  {allergens.map((allergen) => (
                    <span
                      key={allergen}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-700 text-sm font-medium border border-yellow-200"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 1v6M6 9v1" strokeLinecap="round"/>
                      </svg>
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Special Request */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Special Instructions</h4>
              <input
                type="text"
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder="No onions, extra spicy, allergies, etc."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent placeholder:text-gray-400"
              />
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all duration-200 active:scale-95"
                disabled={quantity <= 1}
              >
                <svg width="16" height="2" viewBox="0 0 16 2" fill="none">
                  <path d="M1 1h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
              <span className="text-3xl font-bold text-gray-900 w-12 text-center tabular-nums">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-all duration-200 active:scale-95 shadow-lg shadow-amber-200/50"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Add to Cart Footer */}
        <div className="border-t border-gray-100 p-4 bg-white">
          <button
            onClick={handleAddToCart}
            className="w-full py-4 rounded-2xl bg-amber-500 text-white text-lg font-bold hover:bg-amber-600 active:bg-amber-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-xl shadow-amber-200/50 active:scale-[0.98]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6h12l-1.5 7H7.5L6 6z"/>
              <circle cx="8" cy="17" r="1.5"/>
              <circle cx="15" cy="17" r="1.5"/>
              <path d="M6 6L5 2H2"/>
            </svg>
            Add to Cart — {currency}{totalPrice.toFixed(2)}
            {quantity > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-sm">
                ({quantity}x)
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
