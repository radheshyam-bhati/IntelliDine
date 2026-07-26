import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'

export default async function KitchenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabase()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) redirect('/staff/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (!userData || userData.role !== 'kitchen') {
    redirect('/staff/login')
  }

  return (
    <div className="bg-kds min-h-screen">
      <main className="p-4">{children}</main>
    </div>
  )
}
