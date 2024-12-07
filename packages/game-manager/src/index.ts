import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import roomsRouter from './routes/rooms.js'
import messagesRouter from './routes/messages.js'
import { cleanupOldRooms } from './db/index.js'

const app = new Hono()

// Mount routers
app.route('/rooms', roomsRouter)
app.route('/rooms', messagesRouter)

// Run cleanup every hour
setInterval(cleanupOldRooms, 60 * 60 * 1000)

const port = 9999
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})