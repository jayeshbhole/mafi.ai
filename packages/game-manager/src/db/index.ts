import type { GameState } from "@mafia/types/game";
import type { Player } from "@mafia/types/player";
import Datastore from "nedb-promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gameDb = Datastore.create({
  filename: path.join(__dirname, "../../data/game.db"),
  autoload: true,
}) as Datastore<GameState>;

const playerDB = Datastore.create({
  filename: path.join(__dirname, "../../data/player.db"),
  autoload: true,
}) as Datastore<Player>;

export { gameDb, playerDB };
