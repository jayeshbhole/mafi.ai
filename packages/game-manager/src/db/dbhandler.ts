import type { Socket } from "socket.io";
import { gameDb } from "./index.js";
import type { GameState } from "@mafia/types/game";

export const createGame = async (gameState: GameState) => {
  // Check if room already exists
  const existingGame = await gameDb.findOne<GameState>({ roomId: gameState.roomId });
  if (existingGame) {
    throw new Error("Room already exists");
  }

  await gameDb.insert(gameState);
};

export const updateGame = async (roomId: string, update: Partial<GameState>) => {
  const result = await gameDb.update({ roomId }, { $set: update });
  if (result === 0) {
    throw new Error("Room not found");
  }
};

export const findGame = async (roomId: string) => {
  const game = await gameDb.findOne<GameState>({ roomId });
  if (!game) {
    throw new Error("Room not found");
  }
  return game;
};

export const addPlayerToGame = async (roomId: string, playerId: string) => {
  const game = await findGame(roomId);

  // Check if player is already in the game
  if (game.players.some(p => p.id === playerId)) {
    return game;
  }

  // Add player
  game.players.push({
    id: playerId,
    address: playerId,
    maciData: {},
    name: "",
    isAlive: true,
    isReady: false,
    role: "VILLAGER",
  });

  // Update game
  await updateGame(roomId, { players: game.players });
  return game;
};

export const addToRoom = async (socket: Socket) => {
  const res = await gameDb.find({});
  for (const room of res) {
    // Your code here
  }
};
