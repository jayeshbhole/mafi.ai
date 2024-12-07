import { Hono } from 'hono'
import db from '../db/index.js'
import type { Message, Room } from '../types/index.js'


const router = new Hono()

// Post a message
router.post('/:roomId/messages', async (c) => {
  try {
    const roomId = c.req.param('roomId')
    const { type, sender, content } = await c.req.json()

    if (!['player', 'system'].includes(type)) {
      return c.json({
        success: false,
        error: 'Invalid message type'
      }, 400)
    }

    const message: Message = {
      id: `msg_${Date.now()}`,
      type,
      sender,
      content,
      timestamp: new Date()
    }

    await new Promise<void>((resolve, reject) => {
      db.update(
        { roomId },
        { $push: { messages: message } },
        {},
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    return c.json({
      success: true,
      message
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to post message'
    }, 500)
  }
})

// Get messages for a room
router.get('/:roomId/messages', async (c) => {
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
      messages: room.messages
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch messages'
    }, 500)
  }
})

export default router 