import type { GameMessage, RTCMessage } from "@mafia/types/rtc";
import { create } from "zustand";

interface WebSocketStore {
  socket: WebSocket | null;
  connected: boolean;
  messages: GameMessage[];
  currentPhase: string;
  roomId: string | null;
  systemState: {
    lastAlert: string | null;
    lastSuccess: string | null;
  };
  connect: (roomId: string) => void;
  disconnect: () => void;
  sendMessage: (message: GameMessage) => void;
  addMessage: (message: GameMessage) => void;
  setPhase: (phase: string) => void;
  setSystemAlert: (alert: string | null) => void;
  setSystemSuccess: (success: string | null) => void;
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  socket: null,
  connected: false,
  messages: [],
  currentPhase: "waiting",
  roomId: null,
  systemState: {
    lastAlert: null,
    lastSuccess: null,
  },
  connect: (roomId: string) => {
    set({ roomId });
    const ws = new WebSocket(`ws://localhost:9999/rtc?roomId=${roomId}`);

    ws.onopen = () => {
      set({ connected: true, socket: ws });
    };

    ws.onmessage = event => {
      try {
        const rtcMessage = JSON.parse(event.data) as RTCMessage;
        const message = rtcMessage.data;

        // Handle different message types
        switch (message.type) {
          case "phase_change":
            set({ currentPhase: message.payload.message || "waiting" });
            break;

          default:
            // Add message to the list
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
  sendMessage: (message: GameMessage) => {
    const { socket, roomId } = get();
    if (socket && socket.readyState === WebSocket.OPEN && roomId) {
      const rtcMessage: RTCMessage = {
        type: "GAME_MESSAGE",
        data: message,
        roomId,
      };
      socket.send(JSON.stringify(rtcMessage));
    }
  },
  addMessage: (message: GameMessage) => {
    set(state => ({
      messages: [...state.messages, message],
    }));
  },
  setPhase: (phase: string) => {
    set({ currentPhase: phase });
  },
  setSystemAlert: (alert: string | null) => {
    set(state => ({
      systemState: {
        ...state.systemState,
        lastAlert: alert,
      },
    }));
  },
  setSystemSuccess: (success: string | null) => {
    set(state => ({
      systemState: {
        ...state.systemState,
        lastSuccess: success,
      },
    }));
  },
}));
