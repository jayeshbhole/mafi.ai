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

// Create or join a room
router.post("/create-or-join-room", async c => {
  try {
    const { roomId, player } = await c.req.json<{
      roomId?: string;
      player: Omit<Player, "isAlive" | "isReady" | "role">;
    }>();

    // Try to join existing room if roomId is provided
    if (roomId) {
      const existingRoom = await gameDb.findOne<GameState>({ roomId });
      if (existingRoom) {
        // Check if room is full
        if (existingRoom.players.length >= existingRoom.settings.maxPlayers) {
          return c.json<APIResponse>(
            {
              success: false,
              error: "Room is full",
            },
            400,
          );
        }

        // Check if game has already started
        if (existingRoom.phase !== "LOBBY") {
          return c.json<APIResponse>(
            {
              success: false,
              error: "Game has already started",
            },
            400,
          );
        }

        // Add player to room
        const newPlayer: Player = {
          ...player,
          isAlive: true,
          isReady: false,
          role: "VILLAGER", // Default role, will be assigned properly when game starts
        };

        await gameDb.update(
          { roomId },
          {
            $push: { players: newPlayer },
            $set: { updatedAt: Date.now() },
          },
        );

        return c.json<APIResponse>({
          success: true,
          data: {
            roomId,
            message: "Successfully joined room",
          },
        });
      }
    }

    // Create new room if roomId wasn't provided or room wasn't found
    const newRoomId = roomId || randomUUID();
    const newPlayer: Player = {
      ...player,
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

export default router;
