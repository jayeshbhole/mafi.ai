import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { Server } from "socket.io";
import roomsRouter from "./routes/rooms.js";
import { handleIoServer } from "./socket/index.js";

const port = 9999;

const app = new Hono();
const server = serve({ fetch: app.fetch, port }, info => {
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
    c.set("io", io);
  }
  await next();
});

app.use(varMiddleware);

// Mount routers
app.route("/rooms", roomsRouter);

export default app;
