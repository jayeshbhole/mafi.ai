import type { GamePhase, Message, Player } from "@mafia/types";
import { create } from "zustand";

// export { type GamePhase, type Message, type Player };

export const PHASE_DURATION: Record<GamePhase, number> = {
  LOBBY: 0,
  STARTING: 5,
  DAY: 10,
  NIGHT: 5,
  VOTING: 20,
  RESULT: 10,
  DEATH: 10,
} as const;

export const NIGHT_MESSAGES = [
  "The village falls into a deep slumber...",
  "Shadows lengthen as the Mafia prowls...",
  "A cold wind whispers through empty streets...",
  "The moon casts eerie shadows...",
  "Footsteps echo in the darkness...",
];

interface GameState {
  phase: GamePhase;
  timeLeft: number;
  round: number;
  isTimerActive: boolean;
  players: Player[];
  messages: Message[];
  overlayCard: GamePhase | null;
  nightMessage: string;
  killedPlayer: Player | null;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setTimeLeft: (time: number) => void;
  setRound: (round: number) => void;
  setTimerActive: (active: boolean) => void;
  setOverlayCard: (card: GamePhase | null) => void;
  setNightMessage: (message: string) => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  updateAllPlayers: (updates: Partial<Player>) => void;
  voteForPlayer: (id: string) => void;
  resetVotes: () => void;
  eliminatePlayer: (id: string) => void;
  setKilledPlayer: (killedPlayer: Player | null) => void;
}

const INITIAL_PLAYERS: Player[] = [
  { name: "Alice", role: "VILLAGER", isAlive: true, votes: 0, id: "1" },
  { name: "Bob", role: "AI_MAFIA", isAlive: true, votes: 0, id: "2" },
  { name: "Charlie", role: "VILLAGER", isAlive: true, votes: 0, id: "3" },
  { name: "David", role: "VILLAGER", isAlive: true, votes: 0, id: "4" },
  { name: "Eve", role: "AI_MAFIA", isAlive: true, votes: 0, id: "5" },
];

export const useGameStore = create<GameState>(set => ({
  phase: "DAY",
  round: 0,
  timeLeft: PHASE_DURATION.DAY,
  isTimerActive: true,
  players: INITIAL_PLAYERS,
  messages: [
    {
      id: 1,
      sender: "System",
      content: "Welcome to Mafia! The game is about to begin...",
      type: "system",
      timestamp: Date.now(),
    },
  ],
  overlayCard: null,
  nightMessage: "",
  killedPlayer: null,

  setPhase: phase => set({ phase }),
  setTimeLeft: timeLeft => set({ timeLeft }),
  setRound: round => set({ round }),
  setTimerActive: isTimerActive => set({ isTimerActive }),
  setOverlayCard: overlayCard => set({ overlayCard }),
  setNightMessage: nightMessage => set({ nightMessage }),

  addMessage: message =>
    set(state => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: state.messages.length + 1,
          timestamp: Date.now(),
        },
      ],
    })),

  updatePlayer: (name, updates) =>
    set(state => ({
      players: state.players.map(p => (p.name === name ? { ...p, ...updates } : p)),
    })),

  updateAllPlayers: updates =>
    set(state => ({
      players: state.players.map(p => ({ ...p, ...updates })),
    })),

  voteForPlayer: name =>
    set(state => ({
      players: state.players.map(p => ({
        ...p,
        votes: p.name === name ? (p.votes || 0) + 1 : p.votes,
      })),
    })),

  resetVotes: () =>
    set(state => ({
      players: state.players.map(p => ({ ...p, votes: 0 })),
    })),

  eliminatePlayer: name =>
    set(state => ({
      players: state.players.map(p => (p.name === name ? { ...p, isAlive: false } : p)),
    })),

  setKilledPlayer: killedPlayer => set({ killedPlayer }),
}));
