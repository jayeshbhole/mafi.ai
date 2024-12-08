import { Server, Socket } from "socket.io";
import { GameManager } from "../game/gameManager.js";
import { addPlayerToGame, findGame } from "../db/dbhandler.js";
import { MessageType, type GameMessage } from "@mafia/types/rtc";
import { v4 as uuid } from "uuid";

export const handleIoServer = (io: Server) => {
  console.log("🔌 io server initialized");

  io.on("connection", async (socket: Socket) => {
    console.log("🔌 Socket connected:", socket.id);
    console.log("Current rooms:", socket.rooms);

    // Handle joining a room
    socket.on("join-room", async (roomId: string) => {
      console.log("📥 join-room event received", { socketId: socket.id, roomId });
      try {
        // Add player to game and get updated game state
        console.log("Adding player to game...");
        const gameState = await addPlayerToGame(roomId, socket.id);
        console.log("Game state after adding player:", {
          roomId,
          playerCount: gameState.players.length,
          players: gameState.players.map(p => ({ id: p.id, isReady: p.isReady })),
        });

        // Leave all other rooms first
        console.log("Current rooms before leaving:", socket.rooms);
        socket.rooms.forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
            console.log(`Left room: ${room}`);
          }
        });

        // Join the new room
        socket.join(roomId);
        console.log("Joined new room:", roomId);
        console.log("Current rooms after joining:", socket.rooms);

        // Initialize game manager for this room
        console.log("Initializing game manager...");
        const gameManager = new GameManager(roomId, gameState, gameState.settings);

        // Broadcast system message for new player
        console.log("📤 Broadcasting system message for new player");
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
        console.log("📤 Broadcasting game state to all players:", {
          roomId,
          playerCount: gameState.players.length,
          players: gameState.players.map(p => ({ id: p.id, isReady: p.isReady })),
        });
        io.to(roomId).emit("game-state", {
          gameState,
          messages: gameState.messages,
        });
      } catch (error) {
        console.error("❌ Error joining room:", {
          socketId: socket.id,
          roomId,
          error: error instanceof Error ? error.message : error,
        });
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
    socket.on(MessageType.READY, async (payload: { ready: boolean }) => {
      console.log("📥 Ready event received:", { socketId: socket.id, payload });
      try {
        // Get the room this socket is in (should only be in one room)
        const roomId = Array.from(socket.rooms).find(room => room !== socket.id);
        console.log("Current rooms for socket:", socket.rooms);

        if (!roomId) {
          throw new Error("Player not in any room");
        }
        console.log("Found room for ready event:", roomId);

        console.log("Fetching game state...");
        const gameState = await findGame(roomId);
        console.log("Current game state:", {
          roomId,
          playerCount: gameState.players.length,
          players: gameState.players.map(p => ({ id: p.id, isReady: p.isReady })),
        });

        console.log("Initializing game manager...");
        const gameManager = new GameManager(roomId, gameState, gameState.settings);

        console.log("Handling player ready state...");
        await gameManager.handlePlayerReady(socket.id);

        // Broadcast ready state
        console.log("📤 Broadcasting ready state");
        io.to(roomId).emit(MessageType.READY, {
          id: uuid(),
          timestamp: Date.now(),
          type: MessageType.READY,
          playerId: socket.id,
          payload: {
            message: "ready",
          },
        });

        // Send updated game state to all players
        const updatedGameState = await findGame(roomId);
        console.log("📤 Broadcasting updated game state:", {
          roomId,
          playerCount: updatedGameState.players.length,
          players: updatedGameState.players.map(p => ({ id: p.id, isReady: p.isReady })),
        });
        io.to(roomId).emit("game-state", {
          gameState: updatedGameState,
          messages: updatedGameState.messages,
        });

        // Check if game can start
        console.log("Checking if game can start...");
        if (gameManager.canStartGame()) {
          console.log("🎮 Game can start! Starting game...");
          await gameManager.startGame();
          console.log("📤 Broadcasting game start event");
          io.to(roomId).emit(MessageType.GAME_START, {
            id: uuid(),
            timestamp: Date.now(),
            type: MessageType.GAME_START,
            playerId: "system",
            payload: {
              timestamp: Date.now(),
            },
          });
        } else {
          console.log("Game cannot start yet. Waiting for more players or ready states.");
        }
      } catch (error) {
        console.error("❌ Error handling ready state:", {
          socketId: socket.id,
          error: error instanceof Error ? error.message : error,
        });
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
      console.log("🔌 Socket disconnected:", socket.id);
      console.log("Rooms at disconnect:", socket.rooms);

      // Broadcast to rooms this socket was in
      socket.rooms.forEach(roomId => {
        if (roomId !== socket.id) {
          console.log("📤 Broadcasting disconnect message to room:", roomId);
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
