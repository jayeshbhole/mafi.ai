import type { GameState, GameSettings } from "./game";

export interface GameRoom {
  roomId: string;
  createdAt: number;
  updatedAt?: number;
  players: string[];
  gameState: GameState;
  settings: GameSettings;
}

export interface JoinRoomResponse {
  token: string;
  roomId: string;
}
