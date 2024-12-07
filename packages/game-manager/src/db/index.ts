import Datastore from "nedb";
import path from "path";
import { fileURLToPath } from "url";
import type { Room } from "../types/game.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Datastore<Room>({
  filename: path.join(__dirname, "../../data/games.db"),
  autoload: true,
});

// export const cleanupOldRooms = () => {
//   const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
//   db.remove({ createdAt: { $lt: oneDayAgo } }, { multi: true });
// };

export default db;
