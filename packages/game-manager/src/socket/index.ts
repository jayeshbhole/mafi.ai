import { Server, Socket } from "socket.io";
import { GameManager } from "../game/gameManager.js";
import { gameDb } from "../db/index.js";
import { MessageType, type GameMessage } from "@mafia/types/rtc";
import type { GameState } from "@mafia/types/game";
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
        const gameState = await gameDb.findOne<GameState>({ roomId });
        if (!gameState) {
          socket.emit(MessageType.SYSTEM_ALERT, {
            id: uuid(),
            timestamp: Date.now(),
            type: MessageType.SYSTEM_ALERT,
            playerId: "system",
            payload: {
              message: "Room not found",
            },
          });
          return;
        }

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

        // Send current game state to the new player
        socket.emit("game-state", {
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
            message: "Failed to join room",
          },
        });
      }
    });

    // Handle player ready state
    socket.on(MessageType.READY, async (roomId: string) => {
      try {
        const gameState = await gameDb.findOne<GameState>({ roomId });
        if (!gameState) return;

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
      }
    });

    // Handle chat messages
    socket.on(MessageType.CHAT, async ({ roomId, message }: { roomId: string; message: string }) => {
      try {
        const gameState = await gameDb.findOne<GameState>({ roomId });
        if (!gameState) return;

        const gameManager = new GameManager(roomId, gameState, gameState.settings);
        const success = await gameManager.handlePlayerMessage(socket.id, message);

        if (success) {
          // Broadcast chat message
          io.to(roomId).emit(MessageType.CHAT, {
            id: uuid(),
            timestamp: Date.now(),
            type: MessageType.CHAT,
            playerId: socket.id,
            payload: {
              message,
            },
          });
        }
      } catch (error) {
        console.error("Error handling chat:", error);
      }
    });

    // Handle voting
    socket.on(MessageType.VOTE, async ({ roomId, targetId }: { roomId: string; targetId: string }) => {
      try {
        const gameState = await gameDb.findOne<GameState>({ roomId });
        if (!gameState) return;

        const gameManager = new GameManager(roomId, gameState, gameState.settings);
        const success = await gameManager.handleVote(socket.id, targetId);

        if (success) {
          // Broadcast vote
          io.to(roomId).emit(MessageType.VOTE, {
            id: uuid(),
            timestamp: Date.now(),
            type: MessageType.VOTE,
            playerId: socket.id,
            payload: {
              vote: targetId,
            },
          });

          // Check if voting phase should end
          if (gameManager.shouldEndVoting()) {
            const eliminatedPlayer = await gameManager.processVotingResults();
            if (eliminatedPlayer) {
              // Broadcast death message
              io.to(roomId).emit(MessageType.DEATH, {
                id: uuid(),
                timestamp: Date.now(),
                type: MessageType.DEATH,
                playerId: "system",
                payload: {
                  playerId: eliminatedPlayer,
                },
              });
            }
          }
        }
      } catch (error) {
        console.error("Error handling vote:", error);
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
