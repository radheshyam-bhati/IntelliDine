'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart-context'

interface CartBarProps {
  onSubmitOrder: () => Promise<void>
}

export default function CartBar({ onSubmitOrder }: CartBarProps) {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart()
  const [expanded, setExpanded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gray-900 text-white px-4 py-3 flex items-center justify-between min-touch"
        aria-expanded={expanded}
      >
        <span className="font-medium">
          {totalItems} item{totalItems !== 1 ? 's' : ''}
        </span>
        <span className="font-bold">${totalPrice.toFixed(2)}</span>
      </button>

      {expanded && (
        <div className="bg-white border-t border-gray-200 shadow-lg max-h-80 overflow-y-auto">
          <div className="p-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.menuItem.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.menuItem.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    ${(item.menuItem.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                    className="min-touch flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                    aria-label={`Decrease quantity of ${item.menuItem.name}`}
                  >
                    -
                  </button>
                  <span className="text-sm font-medium w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                    className="min-touch flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                    aria-label={`Increase quantity of ${item.menuItem.name}`}
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.menuItem.id)}
                    className="min-touch flex items-center justify-center w-8 h-8 rounded-full text-red-500 hover:bg-red-50"
                    aria-label={`Remove ${item.menuItem.name}`}
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 p-4 flex gap-3">
            <button
              onClick={clearCart}
              className="min-touch rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="min-touch flex-1 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
