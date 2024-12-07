import { Hono } from "hono";
import { WebSocket, WebSocketServer } from "ws";
import { handleRTCMessage } from "../huddle/rtcHandler.js";
import type { RTCMessage } from "@mafia/types/rtc";

const router = new Hono();
const connectedClients = new Map<string, Set<WebSocket>>();

export function setupWebSocketHandlers(wss: WebSocketServer) {
  wss.on("connection", (ws, req) => {
    // Extract roomId from URL query parameters
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const roomId = url.searchParams.get("roomId");

    if (!roomId) {
      ws.close(1002, "Room ID is required");
      return;
    }

    // Add client to room
    if (!connectedClients.has(roomId)) {
      connectedClients.set(roomId, new Set());
    }
    connectedClients.get(roomId)?.add(ws);

    ws.on("message", async data => {
      try {
        const message = JSON.parse(data.toString()) as RTCMessage;
        const success = await handleRTCMessage(message);

        if (success) {
          // Broadcast message to all clients in the room except sender
          const roomClients = connectedClients.get(roomId);
          roomClients?.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(data.toString());
            }
          });
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        ws.send(JSON.stringify({ error: "Failed to process message" }));
      }
    });

    ws.on("close", () => {
      // Remove client from room
      connectedClients.get(roomId)?.delete(ws);
      if (connectedClients.get(roomId)?.size === 0) {
        connectedClients.delete(roomId);
      }
    });
  });
}

// Export function to broadcast messages
export function broadcastToRoom(roomId: string, message: RTCMessage, excludeWs?: WebSocket) {
  const roomClients = connectedClients.get(roomId);
  if (!roomClients) return;

  const messageStr = JSON.stringify(message);
  roomClients.forEach(client => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

export default router;
