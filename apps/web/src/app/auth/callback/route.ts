import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/staff/orders'

  if (code) {
    const supabase = createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        const role = userData?.role
        let path = next
        if (role === 'kitchen') path = '/kitchen/display'
        else if (role === 'manager') path = '/admin/dashboard'
        return NextResponse.redirect(new URL(path, request.url))
      }
    }
  }

  return NextResponse.redirect(new URL('/staff/login?error=auth_failed', request.url))
}
