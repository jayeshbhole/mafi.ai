import { Hono } from "hono";
import dotenv from "dotenv";
import type { APIResponse } from "@mafia/types/api";
import type { GameState, GameSettings } from "@mafia/types/game";
import { randomUUID } from "crypto";
import { gameDb } from "../db/index.js";
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
    const newRoomId = roomId || randomUUID();
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

    await gameDb.insert(gameState);

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

// Join a room
router.post("/join-room/:roomId", async c => {
  try {
    const data = await c.req.json<{
      playerId?: string;
    }>();

    const { playerId } = data || {};

    if (!playerId) {
      return c.json<APIResponse>({
        success: false,
        error: "Player ID is required",
      });
    }

    const roomId = c.req.param("roomId");

    const gameState = await gameDb.findOne<GameState>({ roomId });

    if (!gameState) {
      return c.json<APIResponse>({
        success: false,
        error: "Room not found",
      });
    }

    const newPlayer: Player = {
      id: playerId,
      address: playerId,
      maciData: {},
      name: "",
      isAlive: true,
      isReady: false,
      role: "VILLAGER",
    };
    gameState.players.push(newPlayer);

    await gameDb.update({ roomId }, gameState);

    return c.json<APIResponse>({
      success: true,
      data: { roomId: gameState.roomId, message: "Successfully joined room" },
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return c.json<APIResponse>(
      {
        success: false,
        error: "Failed to join room",
      },
      500,
    );
  }
});

// Get room info
router.get("/room/:roomId", async c => {
  try {
    const roomId = c.req.param("roomId");
    const gameState = await gameDb.findOne<GameState>({ roomId });

    if (!gameState) {
      return c.json<APIResponse>(
        {
          success: false,
          error: "Room not found",
        },
        404,
      );
    }

    return c.json<APIResponse>({
      success: true,
      data: { gameState },
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    return c.json<APIResponse>(
      {
        success: false,
        error: "Failed to fetch room",
      },
      500,
    );
  }
});

router.get("/", async c => {
  const rooms = await gameDb.find<GameState>({});
  return c.json<APIResponse>({
    success: true,
    data: { rooms },
  });
});

export default router;
