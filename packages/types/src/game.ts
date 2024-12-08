import { Player } from "./player";
import { GameMessage } from "./rtc";

export type GamePhase = "LOBBY" | "STARTING" | "DAY" | "NIGHT" | "VOTING" | "VOTING_RESULT" | "DEATH" | "END";

export interface GameState {
  roomId: string;
  createdAt: number;
  updatedAt?: number;
  settings: GameSettings;

  phase: GamePhase;
  round: number;
  players: Player[];

  // Game progress tracking
  votes: {
    [round: number]: Record<string, string>; // voterId -> targetId mapping for each round
  };
  roles: Record<string, string>;
  messages: GameMessage[];
}

export interface GameSettings {
  minPlayers: number;
  maxPlayers: number;
  aiCount: number;
  dayDuration: number;
  nightDuration: number;
  votingDuration: number;
}
