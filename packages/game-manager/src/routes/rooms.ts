import { Hono } from "hono";
import dotenv from "dotenv";
import type { APIResponse } from "@mafia/types/api";
import type { GameState, GameSettings } from "@mafia/types/game";
import { randomUUID } from "crypto";
import { gameCollection } from "../db/mongo.js";
import type { Player } from "@mafia/types/player";

dotenv.config();

const router = new Hono();

const DEFAULT_SETTINGS: GameSettings = {
  minPlayers: 5,
  maxPlayers: 10,
  aiCount: 1,
  dayDuration: 10,
  nightDuration: 10,
  votingDuration: 10,
};

// Create a room
router.post("/create-room/:roomId?", async c => {
  try {
    const data = await c.req.json<{
      playerId?: string;
    }>();

    const roomId = c.req.param("roomId");

    const { playerId } = data || {};

    if (!playerId) {
      return c.json<APIResponse>({
        success: false,
        error: "Player ID is required",
      });
    }

    // Create new room if roomId wasn't provided or room wasn't found
    const newRoomId = "room1";
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
      roomId: newRoomId,
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

router.post("/join-room/:roomId", async c => {
  const roomId = c.req.param("roomId");
  const data = await c.req.json<{
    playerId: string;
  }>();

  const { playerId } = data;

  const room = await gameCollection.findOne({ roomId });
  if (!room) {
    return c.json<APIResponse>({
      success: false,
      error: "Room not found",
    });
  }

  return c.json<APIResponse>({
    success: true,
    data: {
      roomId: room.roomId,
      message: "Successfully joined room",
    },
  });
});

// Get all rooms
router.get("/all", async c => {
  const rooms = await gameCollection.find({}).toArray();
  return c.json<APIResponse>({
    success: true,
    data: { rooms },
  });
});

export default router;
