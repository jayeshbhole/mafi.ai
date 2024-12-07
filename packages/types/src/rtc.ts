import type { Message, GamePhase } from "./game";

export interface RTCMessage {
  type: "GAME_MESSAGE";
  roomId: string;
  data: GameMessage;
}

export interface GameMessage {
  type: "vote" | "phase" | "eliminate" | "chat";
  payload: {
    playerId: string;
    playerName: string;
    message?: Omit<Message, "id" | "timestamp">;
  };
}

export interface RTCPayload {
  to: string[] | "*";
  payload: string;
  label?: string;
}
