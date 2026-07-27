import { NextResponse } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

const { auth } = NextAuth(authConfig)

const protectedPrefixes = ['/staff', '/kitchen', '/admin']
const publicPrefixes = ['/menu', '/staff/login', '/login', '/_next']

export default auth((req) => {
  const { pathname } = req.nextUrl

  const isPublic = publicPrefixes.some((p) => pathname.startsWith(p))
  if (isPublic) {
    return NextResponse.next()
  }

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))
  if (!isProtected) {
    return NextResponse.next()
  }

  const isLoggedIn = !!req.auth

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
