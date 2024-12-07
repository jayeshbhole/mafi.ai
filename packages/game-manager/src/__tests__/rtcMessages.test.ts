import { describe, it, expect, beforeAll, vi } from "vitest";
import fetch from "node-fetch";
import type { Message, Room } from "../types/index.js";
import { broadcastMessageToRoom } from "../huddle/rtcMessages.js";

const API_URL = "http://localhost:9999";

// Mock the API sendData method
vi.mock("@huddle01/server-sdk/api", () => ({
  API: class {
    constructor() {}
    sendData = vi.fn().mockResolvedValue({ success: true });
  },
}));

describe("RTC Messages", () => {
  let roomId: string;
  let playerToken: string;

  beforeAll(async () => {
    // Create a room and join as a player
    const roomResponse = await fetch(`${API_URL}/rooms/create-room`, {
      method: "POST",
    });
    const roomData = (await roomResponse.json()) as { success: boolean; room: Room };
    roomId = roomData.room.roomId;

    const joinResponse = await fetch(`${API_URL}/rooms/join-room/${roomId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerId: "testPlayer",
      }),
    });
    const joinData = (await joinResponse.json()) as { success: boolean; token: string };
    playerToken = joinData.token;
  });

  it("should broadcast message to RTC when posting", async () => {
    const response = await fetch(`${API_URL}/messages/${roomId}/new-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${playerToken}`,
      },
      body: JSON.stringify({
        type: "player",
        sender: "testPlayer",
        content: "Hello RTC!",
      }),
    });
    const data = (await response.json()) as { success: boolean; message: Message };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify RTC broadcast was attempted
    const mockBroadcast = vi.mocked(broadcastMessageToRoom);
    expect(mockBroadcast).toHaveBeenCalledWith(roomId, data.message);
  });

  it("should succeed even if RTC broadcast fails", async () => {
    // Mock RTC broadcast failure
    vi.mocked(broadcastMessageToRoom).mockRejectedValueOnce(new Error("RTC Error"));

    const response = await fetch(`${API_URL}/messages/${roomId}/new-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "system",
        sender: "system",
        content: "Test message",
      }),
    });
    const data = (await response.json()) as { success: boolean; message: Message };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBeDefined();
  });
});
