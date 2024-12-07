import { Hono } from "hono";
import { GameManager } from "../game/gameManager.js";
import { gameDb } from "../db/index.js";
import type { GameState } from "@mafia/types/game";
import type { APIResponse } from "@mafia/types/api";
import type { GameMessage } from "@mafia/types/rtc";

const router = new Hono();

interface NewMessageRequest {
  type: "player" | "vote";
  sender: string;
  content: string;
  target?: string;
}

// Post a message
router.post("/:roomId/new-message", async c => {
  try {
    const roomId = c.req.param("roomId");
    const { type, sender, content, target } = await c.req.json<NewMessageRequest>();

    // Get room and game state
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

    const gameManager = new GameManager(roomId, gameState, gameState.settings);

    switch (type) {
      case "player":
        const success = await gameManager.handlePlayerMessage(sender, content);
        if (!success) {
          return c.json<APIResponse>(
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
          return c.json<APIResponse>(
            {
              success: false,
              error: "Vote target required",
            },
            400,
          );
        }
        const voteSuccess = await gameManager.handleVote(sender, target);
        if (!voteSuccess) {
          return c.json<APIResponse>(
            {
              success: false,
              error: "Invalid vote",
            },
            400,
          );
        }
        break;

      default:
        return c.json<APIResponse>(
          {
            success: false,
            error: "Invalid message type",
          },
          400,
        );
    }

    return c.json<APIResponse>({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error("Error processing message:", error);
    return c.json<APIResponse>(
      {
        success: false,
        error: "Failed to process message",
      },
      500,
    );
  }
});

// Get messages for a room
router.get("/:roomId/messages", async c => {
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

    return c.json<APIResponse<{ messages: GameMessage[] }>>({
      success: true,
      data: {
        messages: gameState.messages || [],
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return c.json<APIResponse>(
      {
        success: false,
        error: "Failed to fetch messages",
      },
      500,
    );
  }
});

export default router;
