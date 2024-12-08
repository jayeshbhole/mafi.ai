import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { socket } from "@/services/socketService";
import { useGameStore } from "@/services/store/gameStore";
import { MessageType } from "@mafia/types/rtc";
import { useMutation } from "@tanstack/react-query";

interface GameChatProps {
  roomId: string;
  playerId: string;
}

export function GameChat({ playerId }: GameChatProps) {
  const [message, setMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { messages, phase } = useGameStore();

  const { mutate: sendChatMessage } = useMutation({
    mutationKey: ["sendChatMessage"],
    mutationFn: async (message: string) => {
      socket.emit(MessageType.CHAT, { message });
    },
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      sendChatMessage(message);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Phase Banner */}
      <div className="bg-primary/10 p-2 text-center text-primary font-semibold">Current Phase: {phase}</div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          switch (msg.type) {
            case MessageType.CHAT:
              return (
                <div key={index} className={cn("flex", msg.playerId === playerId ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%]",
                      msg.playerId === playerId ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    <div className="text-sm font-medium">Player {msg.playerId}</div>
                    <div>{msg.payload.message}</div>
                  </div>
                </div>
              );
            case MessageType.VOTE:
              return (
                <div key={index} className="text-center text-muted-foreground">
                  Player {msg.playerId} voted for {msg.payload.vote}
                </div>
              );
            case MessageType.SYSTEM_CHAT:
              return (
                <div key={index} className="text-center text-primary italic">
                  {msg.payload.message}
                </div>
              );
            default:
              return null;
          }
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit">Send</Button>
        </div>
      </form>
    </div>
  );
}
