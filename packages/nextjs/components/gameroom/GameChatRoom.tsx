"use client";

import { useEffect, useState } from "react";
import { useGameController } from "../../hooks/useGameController";
import GameHeader from "./GameHeader";
import OverlayCard from "./OverlayCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GameChatRoomProps {
  gameId: string;
}

const GameChatRoom = ({ gameId }: GameChatRoomProps) => {
  const [input, setInput] = useState("");
  const {
    phase,
    timeLeft,
    players,
    messages,
    overlayCard,
    nightMessage,
    handlePhaseEnd,
    handleVote,
    handleMessage,
    phaseDuration,
  } = useGameController(gameId);

  // Handle phase end when timer runs out
  useEffect(() => {
    if (timeLeft === 0) {
      handlePhaseEnd();
    }
  }, [timeLeft, handlePhaseEnd]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    handleMessage(input);
    setInput("");
  };

  return (
    <div className="min-h-screen w-full p-8 transition-colors duration-1000 bg-background">
      <Card className="w-full max-w-4xl mx-auto">
        <GameHeader gameId={gameId} phase={phase} timeLeft={timeLeft} duration={phaseDuration} players={players} />

        <div className="relative">
          <ScrollArea className="h-[60vh] px-6">
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

          {overlayCard && (
            <OverlayCard
              type={overlayCard}
              timeLeft={timeLeft}
              duration={phaseDuration}
              players={players}
              nightMessage={nightMessage}
              onVote={handleVote}
            />
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit">Send</Button>
        </form>
      </Card>
    </div>
  );
};

export default GameChatRoom;
