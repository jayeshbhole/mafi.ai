import type { GameMessage } from "./game.js";

export interface RTCMessage {
  roomId: string;
  type: "GAME_MESSAGE";
  data: GameMessage;
}
