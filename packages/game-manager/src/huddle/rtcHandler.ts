import { gameDb } from "../db/index.js";
import { GameManager } from "../game/gameManager.js";
import type { GameMessage, MessageType } from "@mafia/types/rtc";
import type { GameRoom } from "@mafia/types/api";

// Message validators for different message types
const messageValidators: Record<MessageType, (message: GameMessage, gameManager: GameManager) => Promise<boolean>> = {
  chat: async (message, gameManager) => {
    return gameManager.validateChatMessage(message.playerId);
  },
  vote: async (message, gameManager) => {
    if (message.type !== "vote") return false;
    return gameManager.validateVote(message.playerId, message.payload.vote);
  },
  death: async () => true,
  phase_change: async () => true,
  game_start: async () => true,
  kill: async () => true,
  system_alert: async () => true,
  system_success: async () => true,
  system_chat: async () => true,
  vote_result: async () => true,
  ready: async () => true,
};

export async function handleRTCMessage(message: GameMessage, roomId: string): Promise<boolean> {
  try {
    const { id, payload, playerId, timestamp, type } = message;
    if (!roomId) return false;

    // Get room and create game manager
    const room = (await new Promise((resolve, reject) => {
      gameDb.findOne({ roomId }, (err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    })) as GameRoom | null;

    if (!room) return false;

    const gameManager = new GameManager(roomId, room.gameState, room.settings);

    // Validate message based on type
    const validator = messageValidators[message.type as MessageType];
    if (!validator) return false;

    const isValid = await validator(message, gameManager);
    if (!isValid) return false;

    // Update database with the new message
    await new Promise<void>((resolve, reject) => {
      gameDb.update({ roomId }, { $push: { messages: message } }, {}, err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Process game actions based on message type
    switch (message.type) {
      case "vote":
        await gameManager.handleVote(message.playerId, message.payload.vote);
        break;
    }

    return true;
  } catch (error) {
    console.error("Error handling RTC message:", error);
    return false;
  }
}
