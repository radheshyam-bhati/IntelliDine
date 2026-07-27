import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = (session.user as any).role

  if (!role || !['server', 'manager'].includes(role)) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white">
        <div className="flex items-center justify-between px-4 h-12">
          <Link href="/staff/orders" className="font-semibold text-sm">
            KitchenSync
          </Link>
          <nav className="flex items-center gap-4 text-xs">
            <Link
              href="/staff/orders"
              className="hover:text-gray-300 transition-colors"
            >
              Orders
            </Link>
            {role === 'manager' && (
              <Link
                href="/admin/dashboard"
                className="hover:text-gray-300 transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
