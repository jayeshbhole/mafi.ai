import fetch from "node-fetch";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MockHuddleClient } from "../test-utils/mockHuddleClient.js";
import type { GameMessage, Room } from "../types/game.js";

const API_URL = "http://localhost:9999";
const MOCK_PLAYERS = ["player1", "player2", "player3", "player4", "player5"];

describe("Game Flow", () => {
  let roomId: string;
  const clients: Record<string, MockHuddleClient> = {};
  let room: Room;

  beforeAll(async () => {
    // Create a new room
    const response = await fetch(`${API_URL}/rooms/create-room`, {
      method: "POST",
    });
    const data = (await response.json()) as { success: boolean; room: Room };
    room = data.room;
    roomId = room.roomId;

    // Create and connect clients for each player
    for (const playerId of MOCK_PLAYERS) {
      const joinResponse = await fetch(`${API_URL}/rooms/join-room/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      const joinData = (await joinResponse.json()) as { success: boolean; token: string };

      clients[playerId] = new MockHuddleClient(roomId, playerId, joinData.token);
      await clients[playerId].connect();
    }
  });

  afterAll(async () => {
    // Disconnect all clients
    await Promise.all(Object.values(clients).map(client => client.disconnect()));
  });

  describe("Lobby Phase", () => {
    it("should allow players to chat in lobby", async () => {
      const message = "Hello from lobby!";
      await clients.player1.sendMessage({
        type: "chat",
        content: message,
      });

      // Check if other clients received the message
      for (const playerId of MOCK_PLAYERS) {
        if (playerId !== "player1") {
          const lastMessage = clients[playerId].getLastMessage();
          expect(lastMessage?.type).toBe("chat");
          expect(lastMessage?.content).toBe(message);
          expect(lastMessage?.sender).toBe("player1");
        }
      }
    });

    it("should handle ready status", async () => {
      // Mark all players as ready
      for (const playerId of MOCK_PLAYERS) {
        await clients[playerId].sendMessage({
          type: "ready",
          content: "ready",
          metadata: { ready: true },
        });
      }

      // Wait for game start message
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify game started
      for (const client of Object.values(clients)) {
        const messages = client.getMessages();
        expect(messages.some(m => m.type === "system" && m.content.includes("Game is starting"))).toBe(true);
      }
    });
  });

  describe("Game Phases", () => {
    it("should assign roles to players", async () => {
      // Each player should receive their role privately
      for (const client of Object.values(clients)) {
        const messages = client.getMessages();
        const roleMessage = messages.find(
          m => m.type === "system" && m.metadata?.target === client.playerId && m.content.includes("You are"),
        );
        expect(roleMessage).toBeDefined();
      }

      // Everyone should see AI players announcement
      for (const client of Object.values(clients)) {
        const messages = client.getMessages();
        expect(messages.some(m => m.type === "system" && m.content.includes("AI Mafia players"))).toBe(true);
      }
    });

    describe("Night Phase", () => {
      it("should handle AI mafia actions", async () => {
        // Wait for AI action
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify AI kill message
        for (const client of Object.values(clients)) {
          const messages = client.getMessages();
          const killMessage = messages.find(m => m.type === "ai_action");
          expect(killMessage).toBeDefined();
          expect(killMessage?.metadata?.isAI).toBe(true);
        }
      });

      it("should prevent dead players from participating", async () => {
        const messages = Object.values(clients)[0].getMessages();
        const killMessage = messages.find(m => m.type === "ai_action") as GameMessage;
        const deadPlayer = killMessage.metadata?.target as string;

        // Try to send message as dead player
        const result = await clients[deadPlayer].sendMessage({
          type: "chat",
          content: "I'm dead but talking",
        });

        expect(result.success).toBe(false);
      });
    });

    describe("Day Phase", () => {
      it("should allow alive players to discuss", async () => {
        const messages = Object.values(clients)[0].getMessages();
        const killMessage = messages.find(m => m.type === "ai_action") as GameMessage;
        const deadPlayer = killMessage.metadata?.target as string;
        const alivePlayer = MOCK_PLAYERS.find(p => p !== deadPlayer)!;

        // Send message as alive player
        await clients[alivePlayer].sendMessage({
          type: "chat",
          content: "Discussing who might be mafia",
        });

        // Verify message was received
        for (const client of Object.values(clients)) {
          const lastMessage = client.getLastMessage();
          expect(lastMessage?.type).toBe("chat");
          expect(lastMessage?.sender).toBe(alivePlayer);
        }
      });
    });

    describe("Voting Phase", () => {
      it("should handle voting process", async () => {
        // Wait for voting phase
        await new Promise(resolve => setTimeout(resolve, 2000));

        const alivePlayer = MOCK_PLAYERS.find(
          p =>
            !Object.values(clients)[0]
              .getMessages()
              .some(m => m.metadata?.target === p),
        )!;

        // All alive players vote for one player
        for (const playerId of MOCK_PLAYERS) {
          const client = clients[playerId];
          if (!client.isDead()) {
            await client.sendMessage({
              type: "vote",
              content: `voting for ${alivePlayer}`,
              metadata: { target: alivePlayer },
            });
          }
        }

        // Wait for elimination
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify elimination
        for (const client of Object.values(clients)) {
          const messages = client.getMessages();
          expect(messages.some(m => m.type === "death" && m.content.includes(alivePlayer))).toBe(true);
        }
      });
    });
  });
});
