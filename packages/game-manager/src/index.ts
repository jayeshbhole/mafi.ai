import { serve } from '@hono/node-server'
import { Hono } from 'hono'
// @ts-ignore
import { API } from '@huddle01/server-sdk/api'
// @ts-ignore
import { WebhookReceiver } from "@huddle01/server-sdk/webhooks"
// @ts-ignore
import { AccessToken, Role } from '@huddle01/server-sdk/auth'


import Datastore from 'nedb'
import path from 'path'

const app = new Hono()

// Initialize NeDB
type DbDocs = {
  roomId: string
  createdAt: Date
  players: string[]
}
const db = new Datastore<DbDocs>({
  filename: path.join(__dirname, '../data/rooms.db'),
  autoload: true
})

// Room type definition
interface Room {
  roomId: string
  createdAt: Date
  players: string[]
}

// Environment variables (should be properly configured in production)
const API_KEY = process.env.HUDDLE01_API_KEY || 'your-api-key'

// Create a new room
app.post('/rooms', async (c) => {
  try {
    const roomId = `room_${Date.now()}`
    const room: Room = {
      roomId,
      createdAt: new Date(),
      players: []
    }

    // Store room in database
    await new Promise<void>((resolve, reject) => {
      db.insert(room, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    return c.json({
      success: true,
      roomId,
      message: 'Room created successfully'
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create room'
    }, 500)
  }
})

// Join a room
app.post('/rooms/:roomId/join', async (c) => {
  try {
    const roomId = c.req.param('roomId')
    const { playerId } = await c.req.json()

    // Find room in database
    const room: Room | null = await new Promise((resolve, reject) => {
      db.findOne({ roomId }, (err, doc) => {
        if (err) reject(err)
        else resolve(doc)
      })
    })

    if (!room) {
      return c.json({
        success: false,
        error: 'Room not found'
      }, 404)
    }

    // Generate access token for the player
    const accessToken = new AccessToken({
      apiKey: API_KEY,
      roomId: roomId,
      role: Role.HOST,
      permissions: {
        admin: false,
        canConsume: true,
        canProduce: true,
        canProduceSources: {
          cam: true,
          mic: true,
          screen: true,
        },
        canRecvData: true,
        canSendData: true,
        canUpdateMetadata: true,
      },
      options: {
        metadata: {
          playerId
        },
      },
    })

    const token = accessToken.toJwt()

    // Update room with new player
    await new Promise<void>((resolve, reject) => {
      db.update(
        { roomId },
        { $push: { players: playerId } },
        {},
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    return c.json({
      success: true,
      token,
      roomId,
      message: 'Successfully joined room'
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to join room'
    }, 500)
  }
})

// Get room details
app.get('/rooms/:roomId', async (c) => {
  try {
    const roomId = c.req.param('roomId')
    
    const room: Room | null = await new Promise((resolve, reject) => {
      db.findOne({ roomId }, (err, doc) => {
        if (err) reject(err)
        else resolve(doc)
      })
    })

    if (!room) {
      return c.json({
        success: false,
        error: 'Room not found'
      }, 404)
    }

    return c.json({
      success: true,
      room
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch room'
    }, 500)
  }
})

// List all active rooms
app.get('/rooms', async (c) => {
  try {
    const rooms: Room[] = await new Promise((resolve, reject) => {
      db.find({}, (err: Error | null, docs: DbDocs[]) => {
        if (err) reject(err)
        else resolve(docs)
      })
    })

    return c.json({
      success: true,
      rooms
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch rooms'
    }, 500)
  }
})

// Clean up old rooms (rooms older than 24 hours)
const cleanupOldRooms = () => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  db.remove({ createdAt: { $lt: oneDayAgo } }, { multi: true })
}

// Run cleanup every hour
setInterval(cleanupOldRooms, 60 * 60 * 1000)

const port = 9999
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
