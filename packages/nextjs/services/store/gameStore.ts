import { useSocketStore } from "../socketService";
import { GameMessage, MessageType, Player } from "@mafia/types";
import type { GamePhase, GameState } from "@mafia/types/game";
import { v4 as uuid } from "uuid";
import { create } from "zustand";

export const PHASE_DURATION: Record<GamePhase, number> = {
  LOBBY: 0,
  STARTING: 5,
  DAY: 10,
  NIGHT: 5,
  VOTING: 20,
  VOTING_RESULT: 10,
  DEATH: 10,
  END: 30,
} as const;

export const NIGHT_MESSAGES = [
  "The village falls into a deep slumber...",
  "Shadows lengthen as the Mafia prowls...",
  "A cold wind whispers through empty streets...",
  "The moon casts eerie shadows...",
  "Footsteps echo in the darkness...",
  "The night is dark and full of terrors...",
  "The Mafia strikes while the village sleeps...",
  "The villagers are defenseless against the Mafia...",
  "The night is a time of fear and uncertainty...",
  "The Mafia's reign of terror begins...",
];

interface GameStore {
  playerId: string;

  // Game State
  messages: GameMessage[];
  currentPhase: GamePhase;
  gameState: GameState | null;

  // Game State
  phase: GamePhase;
  timeLeft: number;
  round: number;
  isTimerActive: boolean;
  players: Player[];
  overlayCard: GamePhase | null;
  nightMessage: string;
  killedPlayer: string | null;

  // Game Actions
  setPlayerId: (playerId: string) => void;
  setPhase: (phase: GamePhase) => void;
  setTimeLeft: (time: number) => void;
  setRound: (round: number) => void;
  setTimerActive: (active: boolean) => void;
  setOverlayCard: (card: GamePhase | null) => void;
  setNightMessage: (message: string) => void;
  addMessage: (message: Omit<GameMessage, "id" | "timestamp">) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  updateAllPlayers: (updates: Partial<Player>) => void;
  voteForPlayer: (id: string) => void;
  resetVotes: () => void;
  setEliminatedPlayer: (id: string | undefined) => void;
  setKilledPlayer: (killedPlayer: string | null) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  playerId: "",
  messages: [
    {
      id: "1",
      playerId: "system",
      payload: { message: "Welcome to Mafia! The game is about to begin..." },
      type: MessageType.SYSTEM_CHAT,
      timestamp: Date.now(),
    },
  ],
  currentPhase: "LOBBY",
  gameState: null,

  phase: "DAY",
  round: 0,
  timeLeft: PHASE_DURATION.DAY,
  isTimerActive: true,
  players: [],
  overlayCard: null,
  nightMessage: "",
  killedPlayer: null,

  setPlayerId: playerId => {
    set({ playerId });
    useSocketStore.setState({ playerId });
  },

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
          id: uuid(),
          timestamp: Date.now(),
        } as GameMessage,
      ],
    })),

  updatePlayer: (id, updates) =>
    set(state => ({
      players: state.players.map(p => (p.id === id ? { ...p, ...updates } : p)),
    })),

  updateAllPlayers: updates =>
    set(state => ({
      players: state.players.map(p => ({ ...p, ...updates })),
    })),

  voteForPlayer: id =>
    set(state => ({
      players: state.players.map(p => ({
        ...p,
        votes: p.id === id ? (p.votes || 0) + 1 : p.votes,
      })),
    })),

  resetVotes: () =>
    set(state => ({
      players: state.players.map(p => ({ ...p, votes: 0 })),
    })),

  setEliminatedPlayer: id =>
    set(state => ({
      players: state.players.map(p => (p.id === id ? { ...p, isAlive: false } : p)),
    })),

  setKilledPlayer: killedPlayer => set({ killedPlayer }),
}));
