import type { GameRoom } from "@mafia/types/api";
import type { GameState } from "@mafia/types/game";
import type * as types from "@mafia/types"
import type { Player } from "@mafia/types/player";
import Datastore from "nedb-promises";
import path from "path";
import { fileURLToPath } from "url";
import type { Message } from "@mafia/types/message";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const gamesDb = new Datastore({
//   filename: path.join(__dirname, "../../data/games.db"),
//   autoload: true,
// });
const gameDb = Datastore.create({
  filename: path.join(__dirname, "../../data/game.db"),
  autoload: true,
}) as Datastore<GameState>;

const playerDB = Datastore.create({
  filename: path.join(__dirname, "../../data/player.db"),
  autoload: true,
}) as Datastore<Player>;

const messageDB = Datastore.create({
  filename: path.join(__dirname, "../../data/message.db"),
  autoload: true,
}) as Datastore<Message>;

// export const cleanupOldRooms = () => {
//   const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
//   roomsDb.remove({ createdAt: { $lt: oneDayAgo } }, { multi: true });
// };

export { gameDb, playerDB, messageDB };
