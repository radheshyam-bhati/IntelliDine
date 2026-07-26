'use server'

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'

export async function loginAction(
  prevState: { success: boolean; error: string },
  formData: FormData
): Promise<{ success: boolean; error: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirect') as string) || '/staff/orders'

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' }
  }

  const supabase = createServerSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const role = userData?.role
  let path: string
  if (role === 'kitchen') path = '/kitchen/display'
  else if (role === 'manager') path = '/admin/dashboard'
  else if (role === 'server') path = redirectTo || '/staff/orders'
  else path = redirectTo

  redirect(path)
}

export async function googleLoginAction() {
  const supabase = createServerSupabase()
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (data.url) redirect(data.url)
}
