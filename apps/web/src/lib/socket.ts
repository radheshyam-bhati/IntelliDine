import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function connect(restaurantId: string, token: string, restaurantSlug?: string): Socket {
  if (socket?.connected) {
    return socket
  }

  const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'

  const auth: Record<string, string> = {}
  if (token) {
    auth.token = token
  }
  if (restaurantSlug && !token) {
    auth.restaurantSlug = restaurantSlug
  }

  socket = io(url, {
    auth,
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  })

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message)
  })

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnect(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
