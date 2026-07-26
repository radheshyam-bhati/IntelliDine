import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPrefixes = ['/staff', '/kitchen', '/admin']
const publicPrefixes = ['/menu', '/staff/login', '/_next']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = publicPrefixes.some((p) => pathname.startsWith(p))
  if (isPublic) {
    return NextResponse.next()
  }

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))
  if (!isProtected) {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get(
    process.env.NEXT_PUBLIC_SUPABASE_AUTH_COOKIE_NAME ??
      'sb-kitchensync-auth-token'
  )
  const hasSession = authCookie !== undefined && authCookie.value.length > 0

  if (!hasSession) {
    const loginUrl = new URL('/staff/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
