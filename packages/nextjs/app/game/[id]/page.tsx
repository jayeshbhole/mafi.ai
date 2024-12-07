"use client";

import { useEffect } from "react";
import GameChatRoom from "@/components/gameroom/GameChatRoom";
import { useWebSocketStore } from "@/services/websocketService";

export default function GamePage({ params }: { params: { id: string } }) {
  const { id } = params;

  const { connect, disconnect } = useWebSocketStore();

  useEffect(() => {
    connect(id);
    return () => disconnect();
  }, [id, connect, disconnect]);

  return (
    <main className="flex h-screen flex-col items-center justify-center p-4">
      <GameChatRoom />
    </main>
  );
}
