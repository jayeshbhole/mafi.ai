export type PlayerRole = "VILLAGER" | "AI_MAFIA";

export interface Player {
  id: string;
  address: string;
  maciData: any;
  name: string;
  role: PlayerRole;
  isAlive: boolean;
  isReady: boolean;
  votes?: number;
}
