import { Player } from "./player";

export type GamePhase = "LOBBY" | "STARTING" | "DAY" | "NIGHT" | "VOTING" | "VOTING_RESULT" | "DEATH" | "END";

export interface GameState {
  roomId: string;
  createdAt: number;
  updatedAt?: number;
  settings: GameSettings;

  phase: GamePhase;
  round: number;
  players: Player[];
  aiPlayers: string[];
}

export interface GameSettings {
  minPlayers: number;
  maxPlayers: number;
  aiCount: number;
  dayDuration: number;
  nightDuration: number;
  votingDuration: number;
}
