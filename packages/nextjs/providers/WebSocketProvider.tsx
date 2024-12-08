"use client";

import { type PropsWithChildren, createContext, useContext } from "react";
import { useSocketStore } from "@/services/socketService";

interface WebSocketContextType {
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
});

export function WebSocketProvider({ children }: PropsWithChildren) {
  const connected = useSocketStore(state => state.connected);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
