export type PlayerRole = "VILLAGER" | "AI_MAFIA";

export type GamePhase = "LOBBY" | "STARTING" | "DAY" | "NIGHT" | "VOTING" | "RESULT" | "DEATH";

export interface Player {
  name: string;
  role: PlayerRole;
  isAlive: boolean;
  votes?: number;
  id: string;
}

export interface GameState {
  phase: GamePhase;
  round: number;
  alivePlayers: string[];
  deadPlayers: string[];
  roles: Record<string, PlayerRole>;
  votes: Record<string, string>; // voter -> votee
  nightKills: string[];
  minPlayers: number;
  maxPlayers: number;
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
