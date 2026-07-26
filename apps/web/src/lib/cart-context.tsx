'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { MenuItem } from '@kitchensync/shared'

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  specialRequest?: string
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: MenuItem, quantity?: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((menuItem: MenuItem, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === menuItem.id)
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === menuItem.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }
      return [...prev, { menuItem, quantity }]
    })
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItem.id !== itemId))
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.menuItem.id !== itemId))
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.menuItem.id === itemId ? { ...i, quantity } : i
      )
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
