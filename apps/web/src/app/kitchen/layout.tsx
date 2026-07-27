import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function KitchenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = (session.user as any).role

  if (!role || role !== 'kitchen') {
    redirect('/')
  }

  return (
    <div className="bg-kds min-h-screen">
      <main className="p-4">{children}</main>
    </div>
  )
}
