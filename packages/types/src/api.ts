import type { GameState, GameSettings, Message } from "./game";

export interface GameRoom {
  roomId: string;
  createdAt: number;
  updatedAt?: number;
  players: string[];
  messages: Message[];
  gameState: GameState;
  settings: GameSettings;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface JoinRoomResponse {
  token: string;
  roomId: string;
}
