"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useGameController } from "../../hooks/useGameController";
import GameHeader from "./GameHeader";
import OverlayCard from "./OverlayCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { socket, useSocketStore } from "@/services/socketService";
import { useGameStore } from "@/services/store/gameStore";
import { MessageType } from "@mafia/types";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const GameChatRoom = () => {
  const roomId = useParams().roomId as string;

  const connect = useSocketStore(state => state.connect);
  const disconnect = useSocketStore(state => state.disconnect);
  const sendReady = useSocketStore(state => state.sendReady);

  useEffect(() => {
    connect(roomId);
    // Send ready event after connecting
    const timer = setTimeout(() => {
      console.log("Sending ready event...");
      sendReady();
    }, 1000); // Wait for connection to establish

    return () => {
      clearTimeout(timer);
      disconnect();
    };
  }, [roomId, connect, disconnect, sendReady]);

  const { overlayCard, handleVote } = useGameController(roomId);

  return (
    <div className="relative w-full transition-colors flex flex-col h-screen duration-1000 p-8 bg-background">
      <Card className="w-full max-w-4xl mx-auto flex-1 flex flex-col relative">
        <GameHeader />

        <Messages />

        {overlayCard && <OverlayCard onVote={handleVote} />}

        <ChatInput />
      </Card>
    </div>
  );
};

const Messages = () => {
  const messages = useSocketStore(state => state.messages);

  return (
    <ScrollArea className="flex-1 px-6">
      <div className="space-y-4 py-4">
        {messages.map((message, i) => (
          <div key={i} className={`flex ${message.type === MessageType.CHAT ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 animate-in slide-in-from-bottom-2 duration-300 ${
                message.type === MessageType.CHAT
                  ? "bg-primary text-primary-foreground"
                  : message.type === MessageType.SYSTEM_ALERT
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : message.type === MessageType.SYSTEM_SUCCESS
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : "bg-muted"
              }`}
            >
              {message.type === MessageType.CHAT && <div className="text-xs opacity-75 mb-1">{message.playerId}</div>}
              {"message" in message.payload && <div className="whitespace-pre-wrap">{message.payload.message}</div>}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

const ChatInput = () => {
  const [input, setInput] = useState("");

  const connected = useSocketStore(state => state.connected);
  const address = useGameStore(state => state.playerId);

  const { mutate: sendMessage } = useMutation({
    mutationKey: ["send-message"],
    mutationFn: async () => {
      if (!input.trim() || !connected) return;
      socket.emit(MessageType.CHAT, {
        id: uuidv4(),
        timestamp: Date.now(),
        type: MessageType.CHAT,
        playerId: address,
        payload: { message: input },
      });
    },
    onSuccess: () => {
      setInput("");
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        sendMessage();
      }}
      className="p-4 flex gap-2"
    >
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type a message..."
        className="flex-1"
        disabled={!connected}
      />
      <Button type="submit" disabled={!connected}>
        Send
      </Button>
    </form>
  );
};

export default GameChatRoom;
