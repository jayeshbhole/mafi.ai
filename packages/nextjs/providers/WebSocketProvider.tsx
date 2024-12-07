"use client";

import { type PropsWithChildren, createContext, useContext } from "react";
import { useWebSocketStore } from "@/services/websocketService";

interface WebSocketContextType {
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
});

export function WebSocketProvider({ children }: PropsWithChildren) {
  const { connected } = useWebSocketStore();

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
