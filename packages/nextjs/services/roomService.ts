import type { GameRoom, JoinRoomResponse } from "@mafia/types";

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
    debugger;
    const data: { success: boolean; room: GameRoom; message: string } = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.room;
  },

  // Join a room
  joinRoom: async (roomId: string, playerId: string): Promise<JoinRoomResponse> => {
    const response = await fetch(`${API_URL}/rooms/join-room/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });

    console.log("Join room response", response);

    const data: { success: boolean; token: string; roomId: string; message: string } = await response.json();
    if (!data.success) throw new Error(data.message);

    return data;
  },
};
