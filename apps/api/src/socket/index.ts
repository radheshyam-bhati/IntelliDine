import { Server as SocketServer, Socket } from 'socket.io'
import { supabaseAdmin } from '../lib/supabase-admin.js'
import type { UserRole } from '@kitchensync/shared'

export function registerSocketHandlers(io: SocketServer): void {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token

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

    const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !authUser) {
      return next(new Error('Invalid or expired token'))
    }

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, restaurant_id, role, full_name, phone')
      .eq('id', authUser.id)
      .single()

    if (!profile) {
      return next(new Error('User profile not found'))
    }

    socket.data.user = {
      id: profile.id,
      restaurant_id: profile.restaurant_id,
      role: profile.role as UserRole,
      full_name: profile.full_name,
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
