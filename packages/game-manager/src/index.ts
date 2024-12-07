import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import roomsRouter from "./routes/rooms.js";
import rtcRouter from "./routes/rtc.js";
import { Server } from 'socket.io';
import { handle } from "hono/cloudflare-pages";
import { handleIoServer } from "./socket/index.js";

// import { cleanupOldRooms } from "./db/index.js";
const port = 9999;

const app = new Hono();
const server = serve(
  { fetch: app.fetch, port },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  });

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

handleIoServer(io);

const varMiddleware = createMiddleware<{
  Variables: {
    io: Server;
  };
}>(async (c, next) => {
  if (!c.var.io && io) {
    c.set('io', io);
  }
  await next();
});

app.use(varMiddleware);

// Add CORS middleware
// app.use(
//   "/*",
//   cors({
//     origin: ["http://localhost:3000"],
//     credentials: true,
//     allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     maxAge: 600,
//   }),
// );

// Mount routers
app.route("/rooms", roomsRouter);
app.route("/rtc", rtcRouter);