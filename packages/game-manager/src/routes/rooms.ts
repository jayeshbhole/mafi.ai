import { Hono } from "hono";
import { API } from "@huddle01/server-sdk/api";
import { AccessToken, Role } from "@huddle01/server-sdk/auth";

import db from "../db/index.js";
import dotenv from "dotenv";
import type { Room } from "../types/game.js";

dotenv.config();

const router = new Hono();
const API_KEY = process.env.HUDDLE01_API_KEY;
if (!API_KEY) throw new Error("HUDDLE01_API_KEY is not set");

// Create a new room
router.post("/create-room", async c => {
  try {
    const api = new API({
      apiKey: API_KEY,
    });

    const huddle01Room = await api.createRoom({
      roomLocked: true,
      metadata: JSON.stringify({
        title: "Huddle01 Meeting",
      }),
    });
    const room: Room = {
      roomId: huddle01Room.roomId,
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
      db.insert(room, err => {
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

    const room: Room | null = await new Promise((resolve, reject) => {
      db.findOne({ roomId }, (err, doc) => {
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

    const accessToken = new AccessToken({
      apiKey: API_KEY,
      roomId: roomId,
      role: Role.HOST,
      permissions: {
        admin: false,
        canConsume: true,
        canProduce: true,
        canProduceSources: {
          cam: true,
          mic: true,
          screen: true,
        },
        canRecvData: true,
        canSendData: true,
        canUpdateMetadata: true,
      },
      options: {
        metadata: { playerId },
      },
    });

    const token = accessToken.toJwt();

    await new Promise<void>((resolve, reject) => {
      db.update({ roomId }, { $push: { players: playerId } }, {}, err => {
        if (err) reject(err);
        else resolve();
      });
    });

    return c.json({
      success: true,
      token,
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

    const room: Room | null = await new Promise((resolve, reject) => {
      db.findOne({ roomId }, (err, doc) => {
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
    const rooms: Room[] = await new Promise((resolve, reject) => {
      db.find({}, (err: Error | null, docs: Room[]) => {
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
