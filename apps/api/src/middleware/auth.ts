import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import { AuthError, ForbiddenError } from '../lib/errors.js'
import type { UserRole } from '@kitchensync/shared'

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
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthError('Missing or invalid Authorization header'))
  }

  const token = authHeader.slice(7)

  const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !authUser) {
    return next(new AuthError('Invalid or expired token'))
  }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('id, restaurant_id, role, full_name, phone')
    .eq('id', authUser.id)
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
