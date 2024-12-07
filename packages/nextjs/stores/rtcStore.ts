import type { useRoom } from "@huddle01/react/hooks";
import { create } from "zustand";

interface RTCState {
  roomId: string | null;
  room: ReturnType<typeof useRoom>["room"] | null;
  isConnected: boolean;
  error: string | null;
  peers: Record<string, { peerId: string; displayName?: string }>;

  // Actions
  setRoomId: (roomId: string | null) => void;
  setRoom: (room: ReturnType<typeof useRoom>["room"] | null) => void;
  setConnected: (isConnected: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRTCStore = create<RTCState>(set => ({
  roomId: null,
  room: null,
  isConnected: false,
  error: null,
  peers: {},

  setRoomId: roomId => set({ roomId }),
  setRoom: room => set({ room }),
  setConnected: isConnected => set({ isConnected }),
  setError: error => set({ error }),
}));
