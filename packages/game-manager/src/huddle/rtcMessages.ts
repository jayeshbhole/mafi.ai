import type { GameMessage, RTCMessage } from "@mafia/types/rtc";
import { broadcastToRoom } from "../routes/rtc.js";

export async function broadcastMessageToRoom(roomId: string, message: GameMessage) {
  try {
    const rtcMessage: RTCMessage = {
      type: "GAME_MESSAGE",
      data: message,
      roomId,
    };

    broadcastToRoom(roomId, rtcMessage);
  } catch (error) {
    console.error("Failed to broadcast message:", error);
    throw error;
  }
}
