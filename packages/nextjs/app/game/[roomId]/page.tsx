"use client";

import GameChatRoom from "@/components/gameroom/GameChatRoom";

export default function GamePage({ params }: { params: { id: string } }) {
  return (
    <main className="flex h-screen flex-col items-center justify-center p-4">
      <GameChatRoom />
    </main>
  );
}
