import { Hono } from "hono";
import dotenv from "dotenv";
import type { GameRoom } from "@mafia/types/api";
import { randomUUID } from "crypto";
import { gameDb } from "../db/index.js";

dotenv.config();

const router = new Hono();

// Create a new room
router.post("/create-room", async c => {
  try {
    const room: GameRoom = {
      roomId: randomUUID(),
      gameState: {
        phase: "LOBBY",
        round: 0,
        alivePlayers: [],
        deadPlayers: [],
        aiPlayers: [],
        roles: {},
        votes: {},
        readyPlayers: new Set(),
        nightKills: [],
        minPlayers: 5,
        maxPlayers: 10,
      },
      messages: [],
      players: [],
      settings: {
        minPlayers: 5,
        maxPlayers: 10,
        aiCount: 1,
        dayDuration: 10,
        nightDuration: 10,
        votingDuration: 10,
      },
      createdAt: new Date().getTime(),
    };

    await gameDb.insert(room);

    return c.json({
      success: true,
      roomId: room.roomId,
      message: "Successfully joined room",
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "Failed to join room",
      },
      500,
    );
  }
});

export default router;
