"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery } from "@tanstack/react-query";

interface Message {
  id: number;
  sender: string;
  content: string;
  action?: string;
}

export default function GameChatRoom({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [input, setInput] = useState("");

  const { data: messages = [], refetch } = useQuery<Message[]>({
    queryKey: ["messages", gameId],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [
        { id: 1, sender: "System", content: "Welcome to the game!" },
        { id: 2, sender: "Alice", content: "Hello everyone!" },
        { id: 3, sender: "Bob", content: "Hi there!", action: "Investigate" },
      ];
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!messages) return;
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id: messages.length + 1, sender: "You", content };
    },
    onSuccess: () => {
      refetch();
      setInput("");
    },
  });

  const performActionMutation = useMutation({
    mutationFn: async (action: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return action;
    },
    onSuccess: action => {
      alert(`Action ${action} performed!`);
    },
  });

  const handleSend = () => {
    if (input.trim()) {
      sendMessageMutation.mutate(input);
    }
  };

  return (
    <Card className="w-full max-w-[500px] h-[800px] flex flex-col">
      <CardHeader>
        <CardTitle>Game Room {gameId}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-6 p-4">
            {messages.map(message => (
              <div key={message.id}>
                <div className={`flex ${message.sender === "You" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`relative max-w-[70%] ${
                      message.sender === "You"
                        ? "bg-primary text-primary-foreground rounded-[20px] rounded-br-none"
                        : "bg-secondary rounded-[20px] rounded-bl-none"
                    } p-4 shadow-md`}
                  >
                    {/* Chat bubble tail */}
                    <div
                      className={`absolute bottom-0 ${
                        message.sender === "You"
                          ? "right-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-primary"
                          : "left-0 border-r-[12px] border-r-transparent border-t-[12px] border-t-secondary"
                      }`}
                      style={{
                        transform: "translateY(100%)",
                        width: 0,
                        height: 0,
                      }}
                    />
                    <p className="font-semibold mb-1">{message.sender}</p>
                    <p>{message.content}</p>
                  </div>
                </div>
                {message.action && (
                  <div className={`mt-2 flex ${message.sender === "You" ? "justify-end" : "justify-start"} pl-8`}>
                    <Button
                      size="sm"
                      className="bg-secondary/80 hover:bg-secondary text-secondary-foreground rounded-xl px-6 py-1 text-sm font-medium shadow-md transition-colors"
                      onClick={() => message.action && performActionMutation.mutate(message.action)}
                      disabled={performActionMutation.isPending}
                    >
                      {message.action}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 bg-secondary/50">
        <div className="flex w-full space-x-2">
          <Input
            placeholder="Type a message"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend} disabled={sendMessageMutation.isPending || !input.trim()}>
            Send
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
