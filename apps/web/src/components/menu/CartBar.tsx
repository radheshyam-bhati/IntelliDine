'use client'

import { useState, useRef, useEffect } from 'react'
import { useCart } from '@/lib/cart-context'

interface CartBarProps {
  onSubmitOrder: () => Promise<void>
  taxRate?: number
  serviceChargeRate?: number
  currency?: string
}

export default function CartBar({
  onSubmitOrder,
  taxRate = 0.08,
  serviceChargeRate = 0.10,
  currency = '$',
}: CartBarProps) {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart()
  const [expanded, setExpanded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!expanded) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    const timer = setTimeout(() => document.addEventListener('click', handler), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handler)
    }
  }, [expanded])

  if (items.length === 0) return null

  const subtotal = totalPrice
  const tax = subtotal * taxRate
  const serviceCharge = subtotal * serviceChargeRate
  const discount = couponApplied ? couponDiscount : 0
  const grandTotal = subtotal + tax + serviceCharge - discount

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return
    if (couponCode.toUpperCase() === 'WELCOME10') {
      setCouponDiscount(subtotal * 0.10)
      setCouponApplied(true)
      setCouponError('')
    } else if (couponCode.toUpperCase() === 'SAVE5') {
      setCouponDiscount(5)
      setCouponApplied(true)
      setCouponError('')
    } else {
      setCouponError('Invalid coupon code')
      setCouponApplied(false)
      setCouponDiscount(0)
    }
  }

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
      {/* Collapsed Bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gray-900 text-white px-5 py-4 flex items-center justify-between min-touch transition-all duration-200 hover:bg-gray-800"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-amber-400">
              <path d="M4 4h2l2.5 9h9l2.5-7H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
              <circle cx="16" cy="18" r="1.5" fill="currentColor"/>
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <div className="text-left">
            <p className="font-serif text-sm font-semibold">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-400">
              {couponApplied ? `With ${couponCode.toUpperCase()} applied` : 'Tap to view cart'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-serif font-bold text-lg">{currency}{grandTotal.toFixed(2)}</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M5 7l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {/* Expanded Panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white border-t border-gray-200 shadow-2xl max-h-[70vh] overflow-y-auto">
          {/* Cart Items */}
          <div className="px-5 py-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.menuItem.id}
                className="flex items-center gap-3 py-2"
              >
                {/* Item Image or Placeholder */}
                <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {item.menuItem.image_url ? (
                    <img
                      src={item.menuItem.image_url}
                      alt={item.menuItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                      <span className="text-xl">🍽️</span>
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-serif font-semibold text-gray-900 truncate">
                    {item.menuItem.name}
                  </p>
                  {item.specialRequest && (
                    <p className="text-[10px] text-amber-600 truncate mt-0.5">
                      Note: {item.specialRequest}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-gray-900">
                      {currency}{(item.menuItem.price * item.quantity).toFixed(2)}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-xs text-gray-400">
                        ({currency}{item.menuItem.price.toFixed(2)} each)
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all duration-200 active:scale-95"
                    aria-label={`Decrease quantity of ${item.menuItem.name}`}
                  >
                    <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
                      <path d="M1 1h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-gray-900 tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-all duration-200 active:scale-95"
                    aria-label={`Increase quantity of ${item.menuItem.name}`}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.menuItem.id)}
                  className="w-8 h-8 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all duration-200"
                  aria-label={`Remove ${item.menuItem.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Coupon Code */}
          <div className="px-5 py-3 border-t border-gray-100">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase())
                    setCouponError('')
                  }}
                  placeholder="Coupon code"
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent ${
                    couponError ? 'border-red-300 bg-red-50' : couponApplied ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}
                  disabled={couponApplied}
                />
                {couponApplied && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" fill="#16A34A"/>
                      <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
              {!couponApplied ? (
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim()}
                  className="px-4 py-2.5 text-sm font-semibold text-amber-600 border border-amber-300 rounded-xl hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Apply
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCouponApplied(false)
                    setCouponDiscount(0)
                    setCouponCode('')
                  }}
                  className="px-4 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all duration-200"
                >
                  Remove
                </button>
              )}
            </div>
            {couponError && (
              <p className="mt-1.5 text-xs text-red-500">{couponError}</p>
            )}
            {couponApplied && (
              <p className="mt-1.5 text-xs text-green-600 font-medium">
                {couponCode.toUpperCase()} applied — save {currency}{couponDiscount.toFixed(2)}
              </p>
            )}
          </div>

          {/* Order Summary */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">{currency}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                <span className="font-medium text-gray-900">{currency}{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Service Charge ({(serviceChargeRate * 100).toFixed(0)}%)</span>
                <span className="font-medium text-gray-900">{currency}{serviceCharge.toFixed(2)}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-sm text-green-600">
                  <span className="font-medium">Coupon Discount</span>
                  <span className="font-bold">-{currency}{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="h-px bg-gray-200 my-2" />
              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Total</span>
                <span className="font-serif text-xl">{currency}{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t border-gray-100 flex gap-3 bg-white">
            <button
              onClick={clearCart}
              className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white hover:border-gray-300 transition-all duration-200 active:scale-95"
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-200/50 active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Placing Order...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 1h2l2 9h8l2-6H5"/>
                    <circle cx="6" cy="14" r="1"/>
                    <circle cx="13" cy="14" r="1"/>
                  </svg>
                  Place Order — {currency}{grandTotal.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
