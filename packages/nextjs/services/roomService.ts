import { APIResponse, GameState, type JoinRoomResponse } from "@mafia/types";

const API_URL = "http://localhost:9999";

export const roomService = {
  // Get all active rooms
  getActiveRooms: async (): Promise<GameState[]> => {
    const response = await fetch(`${API_URL}/rooms/all`);
    const data: APIResponse<{ rooms: GameState[] }> = await response.json();

    if (!data.success || !data.data) throw new Error(data.error);

    return data.data.rooms;
  },

  // Create a new room
  createRoom: async ({ playerId }: { playerId: string }): Promise<GameState> => {
    const response = await fetch(`${API_URL}/rooms/create-or-join-room`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    const data: APIResponse<GameState> = await response.json();
    if (!data.success || !data.data) throw new Error(data.error);

    return data.data;
  },

  // Join a room
  joinRoom: async (roomId: string, playerId: string): Promise<JoinRoomResponse> => {
    const response = await fetch(`${API_URL}/rooms/create-or-join-room/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    const data: APIResponse<JoinRoomResponse> = await response.json();
    if (!data.success || !data.data) throw new Error(data.error);

    return data.data;
  },
};
