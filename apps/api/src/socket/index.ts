import { Server as SocketServer, Socket } from 'socket.io'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import type { UserRole } from '@kitchensync/shared'
import { decode } from '@auth/core/jwt'
import cookie from 'cookie'

export function registerSocketHandlers(io: SocketServer): void {
  io.use(async (socket, next) => {
    let token = socket.handshake.auth?.token || socket.handshake.query?.token

    // Attempt to extract NextAuth session token from cookies
    const cookieHeader = socket.request.headers.cookie
    if (cookieHeader) {
      const cookies = cookie.parse(cookieHeader)
      token = cookies['authjs.session-token'] || cookies['__Secure-authjs.session-token'] || token
    }

    if (!token || typeof token !== 'string') {
      const restaurantSlug = socket.handshake.auth?.restaurantSlug || socket.handshake.query?.restaurantSlug
      if (restaurantSlug && typeof restaurantSlug === 'string') {
        const { data: restaurant } = await supabaseAdmin
          .from('restaurants')
          .select('id')
          .eq('slug', restaurantSlug)
          .single()

        if (restaurant) {
          socket.data.user = {
            id: 'anonymous',
            restaurant_id: restaurant.id,
            role: 'customer' as UserRole,
            full_name: 'Anonymous',
            phone: null,
          }
          return next()
        }
      }
      return next(new Error('Authentication required'))
    }

    let decodedToken
    try {
      decodedToken = await decode({
        token,
        secret: process.env.AUTH_SECRET as string,
        salt: process.env.NODE_ENV === 'production' ? "__Secure-authjs.session-token" : "authjs.session-token"
      })
    } catch (e) {
      console.error('JWT Decode Error:', e)
      return next(new Error('Invalid or expired token'))
    }

    if (!decodedToken || !decodedToken.id) {
      return next(new Error('Invalid or expired token'))
    }

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, restaurant_id, role, name, phone')
      .eq('id', decodedToken.id)
      .single()

    if (!profile) {
      return next(new Error('User profile not found'))
    }

    socket.data.user = {
      id: profile.id,
      restaurant_id: profile.restaurant_id,
      role: profile.role as UserRole,
      full_name: profile.name,
      phone: profile.phone,
    }

    next()
  })

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user
    const restaurantId = user.restaurant_id

    console.log(`[Socket] User ${user.id} (${user.role}) connected`)

    if (user.id !== 'anonymous') {
      socket.join(`user:${user.id}`)
    }

    if (restaurantId) {
      switch (user.role) {
        case 'customer':
          socket.join(`restaurant:${restaurantId}:customers`)
          break
        case 'server':
        case 'manager':
          socket.join(`restaurant:${restaurantId}:staff`)
          socket.join(`restaurant:${restaurantId}:customers`)
          break
        case 'kitchen':
          socket.join(`restaurant:${restaurantId}:kitchen`)
          socket.join(`restaurant:${restaurantId}:staff`)
          break
      }
    }

    socket.on('disconnect', () => {
      console.log(`[Socket] User ${user.id} (${user.role}) disconnected`)
    })
  })
}
