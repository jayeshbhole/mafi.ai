import type { Server } from "socket.io";

export const handleIoServer = (io: Server, roomId: string) => {
  io.on("connection", socket => {
    console.log("A user connected", socket.id);
    socket.join("lobby");

    socket.on("join-room", () => {
      socket.leave("lobby");
      console.log("User joined room", roomId);
      socket.join(roomId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};
