import { describe, it, expect, beforeAll } from "vitest";
import fetch from "node-fetch";
import type { Room } from "../types/index.js";

const API_URL = "http://localhost:9999";

describe("Rooms API", () => {
  let roomId: string;
  let playerToken: string;

  describe("Room Creation", () => {
    it("should create a new room successfully", async () => {
      const response = await fetch(`${API_URL}/rooms/create-room`, {
        method: "POST",
      });
      const data = (await response.json()) as { success: boolean; room: Room };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.room).toBeDefined();
      expect(data.room.roomId).toBeDefined();
      expect(data.room.players).toHaveLength(0);
      expect(data.room.messages).toHaveLength(0);

      roomId = data.room.roomId;
    });

    it("should list newly created room in rooms list", async () => {
      const response = await fetch(`${API_URL}/rooms`);
      const data = (await response.json()) as { success: boolean; rooms: Room[] };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.rooms).toBeInstanceOf(Array);
      expect(data.rooms.some(room => room.roomId === roomId)).toBe(true);
    });

    it("should get specific room details", async () => {
      const response = await fetch(`${API_URL}/rooms/${roomId}`);
      const data = (await response.json()) as { success: boolean; room: Room };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.room.roomId).toBe(roomId);
    });

    it("should return 404 for non-existent room", async () => {
      const response = await fetch(`${API_URL}/rooms/non-existent-room`);
      const data = (await response.json()) as { success: boolean; error: string };

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Room not found");
    });
  });

  describe("Room Joining", () => {
    it("should allow a player to join with valid room ID", async () => {
      const response = await fetch(`${API_URL}/rooms/join-room/${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: "player1",
        }),
      });
      const data = (await response.json()) as {
        success: boolean;
        token: string;
        roomId: string;
      };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.roomId).toBe(roomId);

      playerToken = data.token;
    });

    it("should update room player list after joining", async () => {
      const response = await fetch(`${API_URL}/rooms/${roomId}`);
      const data = (await response.json()) as { success: boolean; room: Room };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.room.players).toContain("player1");
    });

    it("should allow multiple players to join", async () => {
      const response = await fetch(`${API_URL}/rooms/join-room/${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: "player2",
        }),
      });
      const data = (await response.json()) as { success: boolean; token: string };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
    });

    it("should reject joining non-existent room", async () => {
      const response = await fetch(`${API_URL}/rooms/join-room/fake-room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: "player3",
        }),
      });
      const data = (await response.json()) as { success: boolean; error: string };

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Room not found");
    });
  });
});
