import { PlayerRole } from "./player";

export type GamePhase = "LOBBY" | "STARTING" | "DAY" | "NIGHT" | "VOTING" | "RESULT" | "DEATH";

export interface GameState {
  roomId: string;
  createdAt: number;
  updatedAt?: number;
  players: string[];
  settings: GameSettings;

  phase: GamePhase;
  round: number;
  alivePlayers: string[];
  deadPlayers: string[];
  roles: Record<string, PlayerRole>;
  votes: Record<string, string>; // voter -> votee
  nightKills: string[];
  readyPlayers: Set<string>;
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
