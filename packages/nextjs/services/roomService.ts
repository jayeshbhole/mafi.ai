import { useWebSocketStore } from "./websocketService";
import { type GameMessage, type GameRoom, type JoinRoomResponse, MessageType } from "@mafia/types";
import { randomUUID } from "crypto";

const API_URL = "http://localhost:9999";

export const roomService = {
  // Get all active rooms
  getActiveRooms: async (): Promise<GameRoom[]> => {
    const response = await fetch(`${API_URL}/rooms`);
    const data: { rooms: GameRoom[]; success: boolean; message: string } = await response.json();

    if (!data.success) throw new Error(data.message);

    return data.rooms;
  },

  // Create a new room
  createRoom: async (): Promise<GameRoom> => {
    const response = await fetch(`${API_URL}/rooms/create-room`, {
      method: "POST",
    });
    const data: { success: boolean; room: GameRoom; message: string } = await response.json();
    if (!data.success) throw new Error(data.message);

    // Connect to WebSocket for the new room
    useWebSocketStore.getState().connect(data.room.roomId);

    return data.room;
  },

  // Join a room
  joinRoom: async (roomId: string, playerId: string): Promise<JoinRoomResponse> => {
    const response = await fetch(`${API_URL}/rooms/join-room/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });

    const data: { success: boolean; token: string; roomId: string; message: string } = await response.json();
    if (!data.success) throw new Error(data.message);

    // Connect to WebSocket for the joined room
    useWebSocketStore.getState().connect(data.roomId);

    return data;
  },

  // Send a chat message
  sendChatMessage: async (roomId: string, playerId: string, content: string): Promise<void> => {
    const message: GameMessage = {
      type: MessageType.CHAT,
      id: randomUUID(),
      timestamp: Date.now(),
      playerId,
      payload: {
        message: content,
      },
    };

    useWebSocketStore.getState().sendMessage(message);
  },

  // Send a vote
  sendVote: async (roomId: string, playerId: string, targetPlayerId: string): Promise<void> => {
    const message: GameMessage = {
      type: MessageType.VOTE,
      playerId,
      id: randomUUID(),
      timestamp: Date.now(),
      payload: {
        vote: targetPlayerId,
      },
    };

    useWebSocketStore.getState().sendMessage(message);
  },

  // Leave room
  leaveRoom: (roomId: string) => {
    useWebSocketStore.getState().disconnect();
  },
};
