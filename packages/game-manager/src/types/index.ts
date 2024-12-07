export interface Message {
  id: string
  type: 'player' | 'system'
  sender: string
  content: string
  timestamp: Date
}

export interface Room {
  roomId: string
  createdAt: Date
  players: string[]
  messages: Message[]
}

export type DbDocs = {
  roomId: string
  createdAt: Date
  players: string[]
  messages: Message[]
} 