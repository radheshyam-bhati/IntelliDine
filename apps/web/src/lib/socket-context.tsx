'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextValue {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false })

export function useSocket() {
  return useContext(SocketContext)
}

export function SocketProvider({
  restaurantId,
  token,
  children,
}: {
  restaurantId: string
  token: string
  children: React.ReactNode
}) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [])

  useEffect(() => {
    if (!restaurantId || !token) return

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'

    const socket = io(url, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [restaurantId, token])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  )
}
