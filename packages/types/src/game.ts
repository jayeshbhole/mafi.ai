export type PlayerRole = "VILLAGER" | "AI_MAFIA";

export type GamePhase = "LOBBY" | "STARTING" | "DAY" | "NIGHT" | "VOTING" | "VOTING_RESULT" | "DEATH" | "END";

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
