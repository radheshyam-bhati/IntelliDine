import './env.js'

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { Redis } from 'ioredis'

import { registerSocketHandlers } from './socket/index.js'
import menuRoutes from './routes/menu.js'
import orderRoutes from './routes/orders.js'
import inventoryRoutes from './routes/inventory.js'
import tableRoutes from './routes/tables.js'
import billingRoutes from './routes/billing.js'
import reservationRoutes from './routes/reservations.js'
import queueRoutes from './routes/queue.js'
import aiRoutes from './routes/ai.js'
import adminRoutes from './routes/admin.js'
import userRoutes from './routes/users.js'
import forecastRoutes from './routes/forecasts.js'
import webRoutes from './routes/web.js'
import { AppError } from './lib/errors.js'

const app = express()
const httpServer = createServer(app)

const io = new SocketServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  },
})

if (process.env.REDIS_URL) {
  const pubClient = new Redis(process.env.REDIS_URL)
  const subClient = pubClient.duplicate()
  io.adapter(createAdapter(pubClient, subClient))
  console.log(`[API] Socket.IO Redis Adapter configured`)
}

app.set('io', io)

app.use(cors({ origin: '*' }))
app.use(express.json())

app.use('/api/menu', menuRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/queue', queueRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)
app.use('/api/forecasts', forecastRoutes)
app.use('/api', webRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } })
})

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      details: (err as any).details,
    })
  }

  console.error('[ERROR]', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  })
})

registerSocketHandlers(io)

const PORT = parseInt(process.env.PORT || '4000', 10)
httpServer.listen(PORT, () => {
  console.log(`[API] KitchenSync API running on port ${PORT}`)
})

export default app
