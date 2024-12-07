import { GamePhase } from "./game";

export enum MessageType {
  READY = "ready",
  GAME_START = "game_start",
  CHAT = "chat",
  SYSTEM_CHAT = "system_chat",
  SYSTEM_ALERT = "system_alert",
  SYSTEM_SUCCESS = "system_success",
  VOTE = "vote",
  VOTE_RESULT = "vote_result",
  DEATH = "death",
  PHASE_CHANGE = "phase_change",
  KILL = "kill",
}

// Base interface for all messages
interface BaseMessage {
  id: string;
  timestamp: number;
}

// Ready message
interface ReadyMessage extends BaseMessage {
  type: MessageType.READY;
  playerId: string;
  payload: {
    message: "ready" | "notReady";
  };
}

// Game start message
interface GameStartMessage extends BaseMessage {
  type: MessageType.GAME_START;
  playerId: "system";
  payload: {
    timestamp: number;
  };
}

// System chat message
interface SystemChatMessage extends BaseMessage {
  type: MessageType.SYSTEM_CHAT;
  playerId: "system";
  payload: {
    message: string;
  };
}

// Chat message
interface ChatMessage extends BaseMessage {
  type: MessageType.CHAT;
  playerId: string;
  payload: {
    message: string;
  };
}

// System alert message
interface SystemAlertMessage extends BaseMessage {
  type: MessageType.SYSTEM_ALERT;
  playerId: "system";
  payload: {
    message: string;
  };
}

// System success message
interface SystemSuccessMessage extends BaseMessage {
  type: MessageType.SYSTEM_SUCCESS;
  playerId: "system";
  payload: {
    message: string;
  };
}

// Vote message
interface VoteMessage extends BaseMessage {
  type: MessageType.VOTE;
  playerId: string;
  payload: {
    vote: string;
  };
}

// Death message
interface DeathMessage extends BaseMessage {
  type: MessageType.DEATH;
  playerId: "system";
  payload: {
    playerId: string;
  };
}

// Phase change message
interface PhaseChangeMessage extends BaseMessage {
  type: MessageType.PHASE_CHANGE;
  playerId: "system";
  payload: {
    message: GamePhase;
  };
}

// Kill message
interface KillMessage extends BaseMessage {
  type: MessageType.KILL;
  playerId: `${string}_ai`;
  payload: {
    targetId: string;
  };
}

// Union of all message types
export type GameMessage<T extends MessageType = MessageType> = T extends any
  ? Extract<
      | ReadyMessage
      | GameStartMessage
      | SystemChatMessage
      | ChatMessage
      | SystemAlertMessage
      | SystemSuccessMessage
      | VoteMessage
      | DeathMessage
      | PhaseChangeMessage
      | KillMessage,
      { type: T }
    >
  : never;
