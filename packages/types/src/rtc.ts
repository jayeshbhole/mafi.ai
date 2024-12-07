import type { Message, MessageType } from "./game";

export interface RTCMessage {
  type: "GAME_MESSAGE";
  roomId: string;
  data: GameMessage;
}

export interface GameMessage {
  type: MessageType;
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
