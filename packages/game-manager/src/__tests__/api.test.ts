import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fetch from 'node-fetch'
import type { Message, Room } from '../types/index.js'

const API_URL = 'http://localhost:9999'

describe('Game Manager API', () => {
  let roomId: string
  let playerToken: string

  describe('Room Creation & Joining', () => {
    it('should create a new room', async () => {
      const response = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
      })
      const data = await response.json() as { success: boolean, room: Room }

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.room.roomId).toBeDefined()
      
      roomId = data.room.roomId
    })

    it('should allow a player to join the room', async () => {
      const response = await fetch(`${API_URL}/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: 'player1'
        })
      })
      const data = await response.json() as { success: boolean, token: string }
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.token).toBeDefined()

      playerToken = data.token
    })
  })

  describe('Messaging', () => {
    it('should post a player message', async () => {
      const response = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${playerToken}`
        },
        body: JSON.stringify({
          type: 'player',
          sender: 'player1',
          content: 'Hello everyone!'
        })
      })
      const data = await response.json() as { success: boolean, message: Message }

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message.type).toBe('player')
    })

    it('should post a system message', async () => {
      const response = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'system',
          sender: 'system',
          content: 'Player1 joined the game'
        })
      })
      const data = await response.json() as { success: boolean, message: Message }

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message.type).toBe('system')
    })

    it('should retrieve all messages', async () => {
      const response = await fetch(`${API_URL}/rooms/${roomId}/messages`)
      const data = await response.json() as { success: boolean, messages: Message[] }

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.messages)).toBe(true)
      expect(data.messages.length).toBe(2)
    })
  })
}) 