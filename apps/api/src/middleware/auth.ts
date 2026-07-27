import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { AuthError, ForbiddenError } from '../lib/errors.js'
import type { UserRole } from '@kitchensync/shared'
import { decode } from '@auth/core/jwt'
import cookie from 'cookie'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        restaurant_id: string | null
        role: UserRole
        full_name: string
        phone: string | null
      }
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  let token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined

  if (!token && req.headers.cookie) {
    const cookies = cookie.parse(req.headers.cookie)
    token = cookies['authjs.session-token'] || cookies['__Secure-authjs.session-token']
  }

  if (!token) {
    return next(new AuthError('Authentication required'))
  }

  let decodedToken
  try {
    decodedToken = await decode({
      token,
      secret: process.env.AUTH_SECRET as string,
      salt: process.env.NODE_ENV === 'production' ? "__Secure-authjs.session-token" : "authjs.session-token"
    })
  } catch (e) {
    return next(new AuthError('Invalid or expired token'))
  }

  if (!decodedToken || !decodedToken.id) {
    return next(new AuthError('Invalid or expired token'))
  }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('id, restaurant_id, role, full_name, phone')
    .eq('id', decodedToken.id)
    .single()

  if (!profile) {
    return next(new AuthError('User profile not found'))
  }

  req.user = {
    id: profile.id,
    restaurant_id: profile.restaurant_id,
    role: profile.role as UserRole,
    full_name: profile.full_name,
    phone: profile.phone,
  }

  next()
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthError('Authentication required'))
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Requires one of roles: ${roles.join(', ')}`))
    }
    next()
  }
}
