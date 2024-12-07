export type PlayerRole = "VILLAGER" | "AI_MAFIA";
export type GamePhase =
  | "LOBBY" // Pre-game chat
  | "STARTING" // Game is about to begin
  | "NIGHT"
  | "DAY"
  | "VOTING";

export interface GameState {
  phase: GamePhase;
  round: number;
  alivePlayers: string[];
  deadPlayers: string[];
  roles: Record<string, PlayerRole>;
  votes: Record<string, string>; // voter -> votee
  nightKills: string[];
  minPlayers: number; // Should be at least 3 (2 AI + 1 villager)
  maxPlayers: number;
  readyPlayers: Set<string>; // Players who are ready to start
  aiPlayers: string[]; // IDs of AI players
}

export type MessageType =
  | "chat" // General chat (for lobby and day phase)
  | "system" // System announcements
  | "vote" // Vote casting
  | "ai_action" // AI mafia actions
  | "death" // Player death announcement
  | "phase_change" // Day/Night announcements
  | "ready" // Player ready status
  | "game_start"; // Game starting announcement

export interface GameMessage {
  id: string;
  type: MessageType;
  sender: string;
  content: string;
  timestamp: Date;
  metadata?: {
    phase?: GamePhase;
    round?: number;
    target?: string; // For votes and kills
    ready?: boolean; // For ready messages
    isAI?: boolean; // To identify AI messages
  };
}

export interface Room {
  roomId: string;
  createdAt: number;
  updatedAt?: number;
  players: string[];
  messages: GameMessage[];
  gameState: GameState;
  settings: {
    dayDuration: number; // in milliseconds
    votingDuration: number;
    nightDuration: number;
    minPlayers: number; // Should be at least 3
    maxPlayers: number;
    aiCount: number; // Number of AI mafia (fixed at 2)
  };
}
