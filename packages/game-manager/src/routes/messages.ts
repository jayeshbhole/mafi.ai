import { Hono } from "hono";
import { GameManager } from "../game/gameManager.js";
import { gameCollection } from "../db/mongo.js";
import type { GameState } from "@mafia/types/game";
import type { APIResponse } from "@mafia/types/api";
import { MessageType, type GameMessage } from "@mafia/types/rtc";

const router = new Hono();

interface NewMessageRequest {
  type: "player" | "vote";
  sender: string;
  content: string;
  target?: string;
}

// Post a message
router.post("/room/:roomId", async c => {
  try {
    const roomId = c.req.param("roomId");
    const data = await c.req.json<NewMessageRequest>();

    const game = await gameCollection.findOne({ roomId });
    if (!game) {
      return c.json<APIResponse>(
        {
          success: false,
          error: "Room not found",
        },
        404,
      );
    }

    const message: GameMessage = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: data.type === "vote" ? MessageType.VOTE : MessageType.CHAT,
      playerId: data.sender,
      payload: {
        message: data.content,
        ...(data.target && { target: data.target }),
      },
    } as GameMessage;

    await gameCollection.updateOne({ roomId }, { $push: { messages: message } });

    return c.json<APIResponse>({
      success: true,
      data: { message },
    });
  } catch (error) {
    console.error("Error posting message:", error);
    return c.json<APIResponse>(
      {
        success: false,
        error: "Failed to post message",
      },
      500,
    );
  }
});

// Get messages for a room
router.get("/room/:roomId", async c => {
  try {
    const roomId = c.req.param("roomId");
    const game = await gameCollection.findOne({ roomId });

    if (!game) {
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
      data: { messages: game.messages || [] },
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
