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

export interface JoinRoomResponse {
  token: string;
  roomId: string;
}
