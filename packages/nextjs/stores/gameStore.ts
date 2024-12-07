import { create } from "zustand";

export type GamePhase = "day" | "night" | "voting";
export type Player = {
  name: string;
  role: "mafia" | "villager";
  isAlive: boolean;
  votes?: number;
};

export type Message = {
  id: number;
  sender: string;
  content: string;
  action?: string;
  type?: "system" | "chat" | "system-alert" | "system-success";
  timestamp: number;
};

export const PHASE_DURATION = {
  day: 20,
  night: 5,
  voting: 15,
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
  isTimerActive: boolean;
  players: Player[];
  messages: Message[];
  overlayCard: "voting" | "night" | null;
  nightMessage: string;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setTimeLeft: (time: number) => void;
  setTimerActive: (active: boolean) => void;
  setOverlayCard: (card: "voting" | "night" | null) => void;
  setNightMessage: (message: string) => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updatePlayer: (name: string, updates: Partial<Player>) => void;
  updateAllPlayers: (updates: Partial<Player>) => void;
  voteForPlayer: (name: string) => void;
  resetVotes: () => void;
  eliminatePlayer: (name: string) => void;
}

const INITIAL_PLAYERS: Player[] = [
  { name: "Alice", role: "villager", isAlive: true, votes: 0 },
  { name: "Bob", role: "mafia", isAlive: true, votes: 0 },
  { name: "Charlie", role: "villager", isAlive: true, votes: 0 },
  { name: "David", role: "villager", isAlive: true, votes: 0 },
  { name: "Eve", role: "mafia", isAlive: true, votes: 0 },
];

export const useGameStore = create<GameState>(set => ({
  phase: "day",
  timeLeft: PHASE_DURATION.day,
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

  setPhase: phase => set({ phase }),
  setTimeLeft: timeLeft => set({ timeLeft }),
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
}));
