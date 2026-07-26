import { CartProvider } from '@/lib/cart-context'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-amber-50 text-gray-900">
        <div className="max-w-2xl mx-auto">{children}</div>
      </div>
    </CartProvider>
  )
}
