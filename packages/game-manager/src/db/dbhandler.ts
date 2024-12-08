import type { Socket } from "socket.io";
import { gameCollection } from "./mongo.js";
import type { GameState } from "@mafia/types/game";

export const createGame = async (gameState: GameState) => {
  // Check if room already exists
  const existingGame = await gameCollection.findOne({ roomId: gameState.roomId });
  if (existingGame) {
    throw new Error("Room already exists");
  }

  await gameCollection.insertOne(gameState);
};

export const findGame = async (roomId: string) => {
  const game = await gameCollection.findOne({ roomId });
  if (!game) {
    throw new Error("Room not found");
  }
  return game;
};

export const addPlayerToGame = async (roomId: string, playerId: string) => {
  const game = await findGame(roomId);

  // Simple check for duplicate player
  if (game.players.find(p => p.id === playerId)) {
    return game;
  }

  // Add player
  const newPlayer = {
    id: playerId,
    address: playerId,
    maciData: {},
    name: "",
    isAlive: true,
    isReady: false,
    role: "VILLAGER",
  };

  // Update game with new player
  const result = await gameCollection.findOneAndUpdate(
    { roomId },
    { $push: { players: newPlayer } },
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("Failed to add player to game");
  }

  return result;
};

export const updateGame = async (roomId: string, updates: Partial<GameState>) => {
  const result = await gameCollection.findOneAndUpdate({ roomId }, { $set: updates }, { returnDocument: "after" });

  if (!result) {
    throw new Error("Failed to update game");
  }

  return result;
};

export const addMessageToGame = async (roomId: string, message: any) => {
  const result = await gameCollection.findOneAndUpdate(
    { roomId },
    { $push: { messages: message } },
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("Failed to add message to game");
  }

  return result;
};

export const updatePlayerInGame = async (roomId: string, playerId: string, updates: any) => {
  const result = await gameCollection.findOneAndUpdate(
    { roomId, "players.id": playerId },
    { $set: { "players.$": { ...updates } } },
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("Failed to update player in game");
  }

  return result;
};
