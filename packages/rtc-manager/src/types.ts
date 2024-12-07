export interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  type: 'chat' | 'system' | 'prompt';
}

export interface GameState {
  roomId: string;
  hostId: string;
  players: Map<string, Player>;
  messages: Message[];
  status: 'waiting' | 'playing' | 'finished';
} 