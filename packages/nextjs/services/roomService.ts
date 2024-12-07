import type { APIResponse, GameRoom, JoinRoomResponse } from "@mafia/types";

const API_URL = "http://localhost:9999";

export const roomService = {
  // Get all active rooms
  getActiveRooms: async (): Promise<GameRoom[]> => {
    const response = await fetch(`${API_URL}/rooms`);
    const data: APIResponse<{ rooms: GameRoom[] }> = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data?.rooms || [];
  },

  // Create a new room
  createRoom: async (): Promise<GameRoom> => {
    const response = await fetch(`${API_URL}/rooms/create-room`, {
      method: "POST",
    });
    const data: APIResponse<{ room: GameRoom }> = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data!.room;
  },

  // Join a room
  joinRoom: async (roomId: string, playerId: string): Promise<JoinRoomResponse> => {
    const response = await fetch(`${API_URL}/rooms/join-room/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    const data: APIResponse<JoinRoomResponse> = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data!;
  },
};
