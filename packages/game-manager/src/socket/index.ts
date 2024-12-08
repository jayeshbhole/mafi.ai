import { Server, Socket } from "socket.io";
import { GameManager } from "../game/gameManager.js";
import { addPlayerToGame, findGame } from "../db/dbhandler.js";
import { MessageType, type GameMessage } from "@mafia/types/rtc";
import { v4 as uuid } from "uuid";

const io = new Server({
  cors: {
    origin: "http://localhost:3000",
  },
});

io.listen(4000);

export const handleIoServer = (io: Server) => {
  io.on("connection", async (socket: Socket) => {
    console.log("A user connected", socket.id);

    // Handle joining a room
    socket.on("join-room", async (roomId: string) => {
      try {
        // Add player to game and get updated game state
        const gameState = await addPlayerToGame(roomId, socket.id);

        // Leave all other rooms first
        socket.rooms.forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
          }
        });

        // Join the new room
        socket.join(roomId);
        console.log("User joined room", roomId);

        // Initialize game manager for this room
        const gameManager = new GameManager(roomId, gameState, gameState.settings);

        // Broadcast system message for new player
        io.to(roomId).emit(MessageType.SYSTEM_CHAT, {
          id: uuid(),
          timestamp: Date.now(),
          type: MessageType.SYSTEM_CHAT,
          playerId: "system",
          payload: {
            message: `Player ${socket.id} has joined the room`,
          },
        });

        // Send current game state to all players
        io.to(roomId).emit("game-state", {
          gameState,
          messages: gameState.messages,
        });
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit(MessageType.SYSTEM_ALERT, {
          id: uuid(),
          timestamp: Date.now(),
          type: MessageType.SYSTEM_ALERT,
          playerId: "system",
          payload: {
            message: error instanceof Error ? error.message : "Failed to join room",
          },
        });
      }
    });

    // Handle player ready state
    socket.on(MessageType.READY, async (roomId: string) => {
      try {
        const gameState = await findGame(roomId);
        const gameManager = new GameManager(roomId, gameState, gameState.settings);
        await gameManager.handlePlayerReady(socket.id);

        // Broadcast ready state
        io.to(roomId).emit(MessageType.READY, {
          id: uuid(),
          timestamp: Date.now(),
          type: MessageType.READY,
          playerId: socket.id,
          payload: {
            message: "ready",
          },
        });

        // Check if game can start
        if (gameManager.canStartGame()) {
          await gameManager.startGame();
          io.to(roomId).emit(MessageType.GAME_START, {
            id: uuid(),
            timestamp: Date.now(),
            type: MessageType.GAME_START,
            playerId: "system",
            payload: {
              timestamp: Date.now(),
            },
          });
        }
      } catch (error) {
        console.error("Error handling ready state:", error);
        socket.emit(MessageType.SYSTEM_ALERT, {
          id: uuid(),
          timestamp: Date.now(),
          type: MessageType.SYSTEM_ALERT,
          playerId: "system",
          payload: {
            message: error instanceof Error ? error.message : "Failed to set ready state",
          },
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected", socket.id);
      // Broadcast to rooms this socket was in
      socket.rooms.forEach(roomId => {
        if (roomId !== socket.id) {
          io.to(roomId).emit(MessageType.SYSTEM_CHAT, {
            id: uuid(),
            timestamp: Date.now(),
            type: MessageType.SYSTEM_CHAT,
            playerId: "system",
            payload: {
              message: `Player ${socket.id} has left the room`,
            },
          });
        }
      });
    });
  });
};
