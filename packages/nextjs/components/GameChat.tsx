import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { roomService } from "@/services/roomService";
import { useWebSocketStore } from "@/services/websocketService";

interface GameChatProps {
  roomId: string;
  playerId: string;
}

export function GameChat({ roomId, playerId }: GameChatProps) {
  const [message, setMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { messages, currentPhase, systemState } = useWebSocketStore();

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await roomService.sendChatMessage(roomId, playerId, message);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleVote = async (targetPlayerId: string) => {
    try {
      await roomService.sendVote(roomId, playerId, targetPlayerId);
    } catch (error) {
      console.error("Error sending vote:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Phase Banner */}
      <div className="bg-primary/10 p-2 text-center text-primary font-semibold">Current Phase: {currentPhase}</div>

      {/* System Messages */}
      {systemState.lastAlert && (
        <Alert variant="destructive" className="mb-2">
          {systemState.lastAlert}
        </Alert>
      )}
      {systemState.lastSuccess && (
        <Alert variant="default" className="mb-2 bg-green-500/10 text-green-500 border-green-500/20">
          {systemState.lastSuccess}
        </Alert>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          switch (msg.type) {
            case "chat":
              return (
                <div key={index} className={cn("flex", msg.playerId === playerId ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%]",
                      msg.playerId === playerId ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    <div className="text-sm font-medium">Player {msg.playerId}</div>
                    <div>{msg.payload?.message}</div>
                  </div>
                </div>
              );
            case "vote":
              return (
                <div key={index} className="text-center text-muted-foreground">
                  Player {msg.playerId} voted for {msg.payload.vote}
                </div>
              );
            case "system":
              return (
                <div key={index} className="text-center text-primary italic">
                  {msg.payload?.message}
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
