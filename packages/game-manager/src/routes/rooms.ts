import { Hono } from "hono";
import dotenv from "dotenv";
import { roomsDb } from "../db/index.js";
import type { GameRoom } from "@mafia/types/api";
import { randomUUID } from "crypto";

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

    await new Promise<void>((resolve, reject) => {
      roomsDb.insert(room, err => {
        if (err) reject(err);
        else resolve();
      });
    });

    return c.json({
      success: true,
      room,
      message: "Room created successfully",
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "Failed to create room",
      },
      500,
    );
  }
});

// Join a room
router.post("/join-room/:roomId", async c => {
  try {
    const roomId = c.req.param("roomId");
    const { playerId } = await c.req.json();

    const room: GameRoom | null = await new Promise((resolve, reject) => {
      roomsDb.findOne({ roomId }, (err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });

    if (!room) {
      return c.json(
        {
          success: false,
          error: "Room not found",
        },
        404,
      );
    }

    await new Promise<void>((resolve, reject) => {
      roomsDb.update({ roomId }, { $push: { players: playerId } }, {}, err => {
        if (err) reject(err);
        else resolve();
      });
    });

    return c.json({
      success: true,
      roomId,
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

// Get room details
router.get("/:roomId", async c => {
  try {
    const roomId = c.req.param("roomId");

    const room: GameRoom | null = await new Promise((resolve, reject) => {
      roomsDb.findOne({ roomId }, (err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });

    if (!room) {
      return c.json(
        {
          success: false,
          error: "Room not found",
        },
        404,
      );
    }

    return c.json({
      success: true,
      room,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "Failed to fetch room",
      },
      500,
    );
  }
});

// List all active rooms
router.get("/", async c => {
  try {
    const rooms: GameRoom[] = await new Promise((resolve, reject) => {
      roomsDb.find({}, (err: Error | null, docs: GameRoom[]) => {
        if (err) reject(err);
        else resolve(docs);
      });
    });

    return c.json({
      success: true,
      rooms,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "Failed to fetch rooms",
      },
      500,
    );
  }
});

export default router;
