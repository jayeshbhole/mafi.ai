import { API } from "@huddle01/server-sdk/api";
import type { Message } from "../types/index.js";

const API_KEY = process.env.HUDDLE01_API_KEY;
if (!API_KEY) throw new Error("HUDDLE01_API_KEY is not set");

const api = new API({
  apiKey: API_KEY,
});

export async function broadcastMessageToRoom(roomId: string, message: Message) {
  try {
    await api.sendData({
      roomId,
      payload: {
        type: "CHAT_MESSAGE",
        data: message,
      },
    });
  } catch (error) {
    console.error("Failed to broadcast message to RTC:", error);
    throw error;
  }
}
