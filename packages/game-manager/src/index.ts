import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Server } from "socket.io";
import { handleIoServer } from "./socket/index.js";
import { connectToDatabase, disconnectFromDatabase } from "./db/mongo.js";
import roomsRouter from "./routes/rooms.js";
import messagesRouter from "./routes/messages.js";
import { createMiddleware } from "hono/factory";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.route("/rooms", roomsRouter);
app.route("/messages", messagesRouter);

const port = process.env.PORT || 9999;

const server = serve({
  fetch: app.fetch,
  port: Number(port),
});

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

handleIoServer(io);

const varMiddleware = createMiddleware<{
  Variables: {
    io: Server;
  };
}>(async (c, next) => {
  if (!c.var.io && io) {
    c.set("io", io);
  }
  await next();
});

app.use("*", varMiddleware);

// Initialize MongoDB connection
await connectToDatabase();

// Handle socket.io connections
handleIoServer(io);

console.log(`Server running on port ${port}`);

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM signal. Shutting down gracefully...\n");
  await disconnectFromDatabase();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT signal. Shutting down gracefully...\n");
  await disconnectFromDatabase();
  process.exit(0);
});
