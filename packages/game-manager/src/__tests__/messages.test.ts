import { describe, it, expect, beforeAll } from "vitest";
import fetch from "node-fetch";
import type { Message, Room } from "../types/index.js";

const API_URL = "http://localhost:9999";

describe("Messages API", () => {
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

  describe("Posting Messages", () => {
    it("should post a player message successfully", async () => {
      const response = await fetch(`${API_URL}/messages/${roomId}/new-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${playerToken}`,
        },
        body: JSON.stringify({
          type: "player",
          sender: "testPlayer",
          content: "Hello everyone!",
        }),
      });
      const data = (await response.json()) as { success: boolean; message: Message };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
      expect(data.message.type).toBe("player");
      expect(data.message.content).toBe("Hello everyone!");
    });

    it("should post a system message successfully", async () => {
      const response = await fetch(`${API_URL}/messages/${roomId}/new-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "system",
          sender: "system",
          content: "A player has joined the game",
        }),
      });
      const data = (await response.json()) as { success: boolean; message: Message };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message.type).toBe("system");
    });

    it("should reject invalid message type", async () => {
      const response = await fetch(`${API_URL}/messages/${roomId}/new-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "invalid",
          sender: "testPlayer",
          content: "This should fail",
        }),
      });
      const data = (await response.json()) as { success: boolean; error: string };

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid message type");
    });

    it("should reject messages to non-existent room", async () => {
      const response = await fetch(`${API_URL}/messages/fake-room/new-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "player",
          sender: "testPlayer",
          content: "This should fail",
        }),
      });
      const data = (await response.json()) as { success: boolean; error: string };

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe("Retrieving Messages", () => {
    it("should get all messages for a room", async () => {
      const response = await fetch(`${API_URL}/messages/${roomId}/get-messages`);
      const data = (await response.json()) as { success: boolean; messages: Message[] };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.messages)).toBe(true);
      expect(data.messages.length).toBe(2); // From previous tests
    });

    it("should return messages in chronological order", async () => {
      const response = await fetch(`${API_URL}/messages/${roomId}/get-messages`);
      const data = (await response.json()) as { success: boolean; messages: Message[] };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Check if messages are ordered by timestamp
      const timestamps = data.messages.map(m => new Date(m.timestamp).getTime());
      const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
      expect(timestamps).toEqual(sortedTimestamps);
    });

    it("should return empty messages array for new room", async () => {
      // Create a new room
      const newRoomResponse = await fetch(`${API_URL}/rooms/create-room`, {
        method: "POST",
      });
      const newRoomData = (await newRoomResponse.json()) as { success: boolean; room: Room };
      const newRoomId = newRoomData.room.roomId;

      // Get messages for new room
      const response = await fetch(`${API_URL}/messages/${newRoomId}/get-messages`);
      const data = (await response.json()) as { success: boolean; messages: Message[] };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messages).toHaveLength(0);
    });
  });
});
