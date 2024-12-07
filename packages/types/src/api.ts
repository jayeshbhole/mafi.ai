import type { GameState, GameSettings } from "./game";
import { GameMessage } from "./rtc";

export interface GameRoom {
  roomId: string;
  createdAt: number;
  updatedAt?: number;
  players: string[];
  messages: GameMessage[];
  gameState: GameState;
  settings: GameSettings;
}

export interface JoinRoomResponse {
  token: string;
  roomId: string;
}
