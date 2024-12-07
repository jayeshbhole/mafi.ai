import { Hono } from "hono";
import db from "../db/index.js";
import type { GameMessage, Room } from "../types/game.js";
import { GameManager } from "../game/gameManager.js";

const router = new Hono();

// Post a message
router.post("/:roomId/new-message", async c => {
  try {
    const roomId = c.req.param("roomId");
    const { type, sender, content, target } = await c.req.json();

    // Get room and game state
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

    const gameManager = new GameManager(roomId, room.gameState, room.settings);

    switch (type) {
      case "player":
        const success = await gameManager.handlePlayerMessage(sender, content);
        if (!success) {
          return c.json(
            {
              success: false,
              error: "Cannot send message at this time",
            },
            400,
          );
        }
        break;

      case "vote":
        if (!target) {
          return c.json(
            {
              success: false,
              error: "Vote target required",
            },
            400,
          );
        }
        const voteSuccess = await gameManager.handleVote(sender, target);
        if (!voteSuccess) {
          return c.json(
            {
              success: false,
              error: "Invalid vote",
            },
            400,
          );
        }
        break;

      default:
        return c.json(
          {
            success: false,
            error: "Invalid message type",
          },
          400,
        );
    }

    return c.json({
      success: true,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "Failed to process message",
      },
      500,
    );
  }
});

// Get messages for a room
router.get("/:roomId/get-messages", async c => {
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
      messages: room.messages,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "Failed to fetch messages",
      },
      500,
    );
  }
});

export default router;
