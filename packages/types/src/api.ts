import type { GameState } from "./game";
import type { GameMessage } from "./rtc";

export interface JoinRoomResponse {
  token: string;
  roomId: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}
