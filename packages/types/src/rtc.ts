export interface RTCMessage {
  type: "GAME_MESSAGE";
  roomId: string;
  data: GameMessage;
}

export interface GameMessage {
  type: MessageType;
  playerId: string;
  id: string;
  timestamp: number;
  payload: {
    message?: string;
    vote?: any;
    deathId?: string;
    eliminateId?: string;
  };
}

export type MessageType =
  | "chat"
  | "system"
  | "system-alert"
  | "system-success"
  | "vote"
  | "death"
  | "phase_change"
  | "ready"
  | "game_start";

export interface RTCPayload {
  to: string[] | "*";
  payload: string;
  label?: string;
}
