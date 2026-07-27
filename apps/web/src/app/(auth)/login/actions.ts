'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function loginAction(
  prevState: { success: boolean; error: string },
  formData: FormData
): Promise<{ success: boolean; error: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirect') as string) || '/'

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' }
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo,
    })
    return { success: true, error: '' } // This line won't execute on success because NextAuth throws a NEXT_REDIRECT error on success
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Invalid credentials.' }
        default:
          return { success: false, error: 'Something went wrong.' }
      }
    }
    throw error // Re-throw NEXT_REDIRECT error
  }
}

export async function googleLoginAction() {
  await signIn('google', { redirectTo: '/' })
}
