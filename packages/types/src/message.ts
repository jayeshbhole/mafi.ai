export type MessageType =
  | "chat"
  | "system"
  | "system-alert"
  | "system-success"
  | "vote"
  | "ai_action"
  | "death"
  | "phase_change"
  | "ready"
  | "game_start";

export interface Message {
  id: number;
  sender: string;
  content: string;
  type: MessageType;
  timestamp: number;
}