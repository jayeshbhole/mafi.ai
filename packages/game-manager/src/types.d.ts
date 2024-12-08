import { Server } from "socket.io";

declare module "hono" {
  interface ContextVariableMap {
    io: Server;
  }
} 