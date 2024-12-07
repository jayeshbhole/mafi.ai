import { GameMessage, MessageType } from "@mafia/types";
import type { GamePhase, GameState, Player } from "@mafia/types/game";
import { randomUUID } from "crypto";
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
  // Connection State
  socket: WebSocket | null;
  connected: boolean;
  roomId: string | null;
  playerId: string;

  // Game State
  messages: GameMessage[];
  currentPhase: GamePhase;
  gameState: GameState | null;

  // Actions
  connect: (roomId: string) => void;
  disconnect: () => void;
  sendMessage: (content: string) => void;
  sendVote: (targetId: string) => void;
  setReady: (ready: boolean) => void;
  setPlayerId: (playerId: string) => void;

  // Game State
  phase: GamePhase;
  timeLeft: number;
  round: number;
  isTimerActive: boolean;
  players: Player[];
  overlayCard: GamePhase | null;
  nightMessage: string;
  killedPlayer: Player | null;

  // Game Actions
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
  eliminatePlayer: (id: string) => void;
  setKilledPlayer: (killedPlayer: Player | null) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial State
  socket: null,
  connected: false,
  roomId: null,
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
  // Initial Connection State

  // Initial Game State
  phase: "DAY",
  round: 0,
  timeLeft: PHASE_DURATION.DAY,
  isTimerActive: true,
  players: [],

  overlayCard: null,
  nightMessage: "",
  killedPlayer: null,

  // Connection Actions
  connect: (roomId: string) => {
    set({ roomId });
    const ws = new WebSocket(`ws://localhost:9999/rtc?roomId=${roomId}`);

    ws.onopen = () => {
      set({ connected: true, socket: ws });
    };

    ws.onmessage = event => {
      try {
        const message = JSON.parse(event.data) as GameMessage;

        switch (message.type) {
          case MessageType.PHASE_CHANGE:
            set({ phase: (message.payload.message as GamePhase) || "LOBBY" });
            break;
          case MessageType.SYSTEM_ALERT:
            set(state => ({
              messages: [...state.messages, message],
            }));
            break;
          case MessageType.SYSTEM_SUCCESS:
            set(state => ({
              messages: [...state.messages, message],
              isTimerActive: false,
              timeLeft: PHASE_DURATION.END,
            }));
            break;
          case MessageType.VOTE_RESULT:
            set(state => ({
              messages: [...state.messages, message],
              eliminatedPlayer: state.players.find(p => p.id === message.payload.eliminatedPlayerId),
            }));
            break;
          default:
            set(state => ({
              messages: [...state.messages, message],
            }));
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    };

    ws.onerror = error => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      set({ connected: false, socket: null });
    };
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null, connected: false, roomId: null });
    }
  },

  sendMessage: (content: string) => {
    const { socket, playerId, addMessage } = get();
    if (!socket) return;

    const message: GameMessage = {
      type: MessageType.CHAT,
      payload: { message: content },
      id: randomUUID(),
      timestamp: Date.now(),
      playerId,
    };

    socket.send(JSON.stringify(message));
    addMessage(message);
  },

  sendVote: (targetId: string) => {
    const { socket, playerId } = get();
    if (!socket) return;

    const message: GameMessage = {
      type: MessageType.VOTE,
      payload: { vote: targetId },
      id: randomUUID(),
      timestamp: Date.now(),
      playerId,
    };

    socket.send(JSON.stringify(message));
  },

  setReady: (ready: boolean) => {
    const { socket } = get();
    if (!socket) return;

    const message: GameMessage = {
      type: MessageType.READY,
      payload: { message: ready ? "ready" : "notReady" },
      id: randomUUID(),
      timestamp: Date.now(),
      playerId: get().playerId,
    };

    socket.send(JSON.stringify(message));
  },

  // Game Actions
  setPlayerId: playerId => set({ playerId }),
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
          id: randomUUID(),
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

  eliminatePlayer: id =>
    set(state => ({
      players: state.players.map(p => (p.id === id ? { ...p, isAlive: false } : p)),
    })),

  setKilledPlayer: killedPlayer => set({ killedPlayer }),
}));
