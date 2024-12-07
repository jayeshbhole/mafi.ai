import Datastore from "nedb";
import path from "path";
import { fileURLToPath } from "url";
import type { GameState, Room } from "../types/game.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const roomsDb = new Datastore<Room>({
  filename: path.join(__dirname, "../../data/rooms.db"),
  autoload: true,
});
const gamesDb = new Datastore<GameState>({
  filename: path.join(__dirname, "../../data/games.db"),
  autoload: true,
});

// export const cleanupOldRooms = () => {
//   const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
//   roomsDb.remove({ createdAt: { $lt: oneDayAgo } }, { multi: true });
// };

export { gamesDb, roomsDb };
