import { type GameMessage, MessageType } from "@mafia/types";
import { type Socket, io } from "socket.io-client";
import { v4 as uuid } from "uuid";
import { create } from "zustand";

const URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

interface ServerToClientEvents {
  [MessageType.CHAT]: (message: GameMessage) => void;
  [MessageType.SYSTEM_CHAT]: (message: GameMessage) => void;
  [MessageType.SYSTEM_ALERT]: (message: GameMessage) => void;
  [MessageType.PHASE_CHANGE]: (message: GameMessage) => void;
  [MessageType.VOTE]: (message: GameMessage) => void;
  [MessageType.GAME_START]: (message: GameMessage) => void;
  [MessageType.READY]: (message: GameMessage) => void;
  [MessageType.DEATH]: (message: GameMessage) => void;
}

interface ClientToServerEvents {
  "join-room": (roomId: string) => void;
  [MessageType.CHAT]: (payload: { message: string }) => void;
  [MessageType.VOTE]: (payload: { targetId: string }) => void;
  [MessageType.READY]: (payload: { ready: boolean }) => void;
}

interface SocketStore {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  connected: boolean;
  messages: GameMessage[];
  playerId: string;
  connect: (roomId: string) => void;
  disconnect: () => void;
  // sendMessage: (payload: GameMessage<MessageType.CHAT>) => void;
  // sendVote: (payload: GameMessage<MessageType.VOTE>) => void;
  // setReady: (payload: GameMessage<MessageType.READY>) => void;
  // setPlayerId: (id: string) => void;
}

export const socket = io(URL, {
  autoConnect: false,
}); //as Socket<ServerToClientEvents, ClientToServerEvents>;

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  connected: false,
  messages: [],
  playerId: "",

  setPlayerId: (id: string) => set({ playerId: id }),

  connect: (roomId: string) => {
    console.log("Connecting to socket server", socket);

    socket.connect();
    socket.emit("join-room", roomId);

    socket.on("connect", () => {
      set({ connected: true, socket });
      console.log("Connected to socket server");
    });

    socket.on("disconnect", () => {
      set({ connected: false });
      console.log("Disconnected from socket server");
    });
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      set({ connected: false, socket: null });
    }
  },

  // sendMessage: (content: GameMessage) => {
  //   if (socket) {
  //     // const payload: GameMessage = {
  //     //   type: MessageType.CHAT,
  //     //   id: uuid(),
  //     //   payload: {
  //     //     message: content,
  //     //   },
  //     //   playerId: get().playerId,
  //     //   timestamp: Date.now(),
  //     // };
  //     socket.emit(MessageType.CHAT, content);
  //   }
  // },

  // sendVote: (payload: GameMessage<MessageType.VOTE>) => {
  //   if (socket) {
  //     socket.emit(MessageType.VOTE, payload);
  //   }
  // },

  // setReady: (payload: GameMessage<MessageType.READY>) => {
  //   if (socket) {
  //     socket.emit(MessageType.READY, payload);
  //   }
  // },
}));
