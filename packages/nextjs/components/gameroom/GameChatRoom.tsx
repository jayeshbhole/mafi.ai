"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGameController } from "../../hooks/useGameController";
import GameHeader from "./GameHeader";
import OverlayCard from "./OverlayCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGameStore } from "@/stores/gameStore";

const GameChatRoom = () => {
  const gameId = useSearchParams().get("gameId") ?? "game-id";
  const { overlayCard, handleVote } = useGameController(gameId);

  return (
    <div className="relative w-full transition-colors flex flex-col h-screen duration-1000 p-8 bg-background">
      <Card className="w-full max-w-4xl mx-auto flex-1 flex flex-col relative">
        <GameHeader gameId={gameId} />

        <Messages />

        {overlayCard && <OverlayCard onVote={handleVote} />}

        <ChatInput />
      </Card>
    </div>
  );
};

const Messages = () => {
  const messages = useGameStore(state => state.messages);
  return (
    <ScrollArea className="flex-1 px-6">
      <div className="space-y-4 py-4">
        {messages.map((message, i) => (
          <div key={i} className={`flex ${message.type === "chat" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 animate-in slide-in-from-bottom-2 duration-300 ${
                message.type === "chat"
                  ? "bg-primary text-primary-foreground"
                  : message.type === "system-alert"
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : message.type === "system-success"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : "bg-muted"
              }`}
            >
              {message.type === "chat" && <div className="text-xs opacity-75 mb-1">{message.sender}</div>}
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

const ChatInput = () => {
  const [input, setInput] = useState("");
  const addMessage = useGameStore(state => state.addMessage);

  // Message handler
  const handleMessage = useCallback(
    (content: string) => {
      addMessage({
        sender: "You",
        content,
        type: "chat",
      });
    },
    [addMessage],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      handleMessage(input);
      setInput("");
    },
    [handleMessage, input],
  );

  return (
    <form onSubmit={handleSubmit} className="p-4 flex gap-2">
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type a message..."
        className="flex-1"
      />
      <Button type="submit">Send</Button>
    </form>
  );
};

export default GameChatRoom;
