import { Hono } from "hono";
import dotenv from "dotenv";
import type { APIResponse } from "@mafia/types/api";
import type { GameState, GameSettings } from "@mafia/types/game";
import { randomUUID } from "crypto";
import { gameCollection } from "../db/mongo.js";
import type { Player, PlayerRole } from "@mafia/types/player";

dotenv.config();

const router = new Hono();

const DEFAULT_SETTINGS: GameSettings = {
  minPlayers: 3,
  maxPlayers: 10,
  aiCount: 1,
  dayDuration: 10,
  nightDuration: 10,
  votingDuration: 10,
};

// Create a room
router.post("/create-or-join-room/:roomId?", async c => {
  try {
    const data = await c.req.json<{
      playerId: string;
    }>();

    // const roomId = c.req.param("roomId");
    // const newRoomId = "room1";
    const roomId = "room1";

    const room = await gameCollection.findOne({ roomId });

    if (roomId) {
      if (room) {
        const newPlayer: Player = {
          id: data.playerId,
          address: data.playerId,
          maciData: {},
          name: "",
          isAlive: true,
          isReady: false,
          role: data.playerId === "first_ai" ? "AI_MAFIA" : "VILLAGER",
        };

        await gameCollection.updateOne({ roomId }, { $push: { players: newPlayer } });

        return c.json<APIResponse>({
          success: true,
          data: { roomId, message: "Successfully joined room" },
        });
      }
    }

    const { playerId } = data || {};

    if (!playerId) {
      return c.json<APIResponse>({
        success: false,
        error: "Player ID is required",
      });
    }

    // Create new room if roomId wasn't provided or room wasn't found
    const newPlayer: Player = {
      id: playerId,
      address: playerId,
      maciData: {},
      name: "",
      isAlive: true,
      isReady: false,
      role: "VILLAGER", // Default role, will be assigned properly when game starts
    };

    const gameState: GameState = {
      roomId: roomId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      phase: "LOBBY",
      round: 0,
      players: [newPlayer],
      messages: [],
      votes: {},
      roles: {},
      settings: DEFAULT_SETTINGS,
    };

    await gameCollection.insertOne(gameState);

    return c.json<APIResponse>({
      success: true,
      data: {
        roomId: gameState.roomId,
        message: "Successfully created new room",
      },
    });
  } catch (error) {
    console.error("Error creating/joining room:", error);
    return c.json<APIResponse>(
      {
        success: false,
        error: "Failed to create/join room",
      },
      500,
    );
  }
});
router.get("/all", async c => {
  const rooms = await gameCollection.find({}).toArray();
  return c.json<APIResponse>({
    success: true,
    data: { rooms },
  });
});

export default router;
