import { API } from "@huddle01/server-sdk/api";
import type { GameMessage } from "../types/game.js";
import type { RTCMessage } from "../types/rtc.js";

const API_KEY = process.env.HUDDLE01_API_KEY;
if (!API_KEY) throw new Error("HUDDLE01_API_KEY is not set");

const api = new API({
  apiKey: API_KEY,
});

export async function broadcastMessageToRoom(roomId: string, message: GameMessage) {
  try {
    const rtcMessage: RTCMessage = {
      type: "GAME_MESSAGE",
      data: message,
      roomId,
    };

    await api.sendData({
      roomId,
      payload: rtcMessage,
    });
  } catch (error) {
    console.error("Failed to broadcast message to RTC:", error);
    throw error;
  }
}
