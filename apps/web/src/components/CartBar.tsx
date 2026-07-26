'use client'

'use client'

import { useState, useRef, useEffect } from 'react'
import { useCart } from '@/lib/cart-context'

interface CartBarProps {
  onSubmitOrder: () => Promise<void>
}

export default function CartBar({ onSubmitOrder }: CartBarProps) {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart()
  const [expanded, setExpanded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close cart on tap outside
  useEffect(() => {
    if (!expanded) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    // Delay to avoid immediately closing on the toggle click
    const timer = setTimeout(() => document.addEventListener('click', handler), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handler)
    }
  }, [expanded])

  if (items.length === 0) return null

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmitOrder()
      setExpanded(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div ref={panelRef} className="fixed bottom-0 left-0 right-0 z-50">
      {/* Collapsed bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gray-900 text-white px-5 py-3.5 flex items-center justify-between min-touch transition-colors hover:bg-gray-800"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5">
          {/* Simple cart icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-amber-400">
            <path d="M3 1L1 4v11a2 2 0 002 2h12a2 2 0 002-2V4l-2-3H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 4h16M13 7a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-serif text-sm">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-base">${totalPrice.toFixed(2)}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {/* Expanded cart panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="px-5 py-4 space-y-3 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.menuItem.id}
                className="flex items-center justify-between gap-3 py-1"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-serif font-medium text-gray-900 truncate">
                    {item.menuItem.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    ${(item.menuItem.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                    className="min-touch flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                    aria-label={`Decrease quantity of ${item.menuItem.name}`}
                  >
                    <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
                      <path d="M1 1h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <span className="text-sm font-medium w-6 text-center tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                    className="min-touch flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                    aria-label={`Increase quantity of ${item.menuItem.name}`}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => removeItem(item.menuItem.id)}
                    className="min-touch flex items-center justify-center w-7 h-7 rounded-full text-gray-300 hover:text-red-500 transition-colors"
                    aria-label={`Remove ${item.menuItem.name}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 px-5 py-3 flex gap-3 bg-gray-50">
            <button
              onClick={clearCart}
              className="min-touch rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-white hover:border-gray-300 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="min-touch flex-1 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
