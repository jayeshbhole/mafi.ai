import type { Socket } from "socket.io";
import { gameDb } from "./index.js";

export const createGame = async () => {
  const game = {
    players: [],
    state: "LOBBY",
    phase: "DAY",
    day: 0,
    night: 0,
    chat: [],
  };
  await gameDb.insert(game);
};

export const addToRoom = async (socket: Socket) => {
  const res = await gameDb.find({});
  for (const room of res) {
    // Your code here
  }
};
