import { memo, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GameMessage, MessageType } from "@mafia/types/rtc";

interface MessageListProps {
  messages: GameMessage[];
}

const MessageList = memo(({ messages }: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-4">
        {messages
          .filter(m => {
            if ("message" in m.payload) return true;
            return false;
          })
          .map(message => (
            <div key={message.id} className="animate-in slide-in-from-bottom duration-300">
              <div className={`flex ${message.playerId === "You" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`relative max-w-[80%] p-4 shadow-md ${
                    message.type?.startsWith("system")
                      ? "bg-destructive/20 text-destructive-foreground border-2 border-destructive font-medium rounded-lg mx-auto text-center"
                      : message.playerId === "You"
                        ? "bg-primary text-primary-foreground rounded-[20px] rounded-br-none"
                        : "bg-secondary rounded-[20px] rounded-bl-none"
                  }`}
                >
                  <p className="font-semibold mb-1">{message.playerId}</p>
                  {message.type === MessageType.CHAT && (
                    <p className="whitespace-pre-line">{message.payload.message}</p>
                  )}
                  {!message.type?.startsWith("system") && (
                    <div
                      className={`absolute bottom-0 ${
                        message.playerId === "You"
                          ? "right-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-primary"
                          : "left-0 border-r-[12px] border-r-transparent border-t-[12px] border-t-secondary"
                      }`}
                      style={{
                        transform: "translateY(100%)",
                        width: 0,
                        height: 0,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
});

MessageList.displayName = "MessageList";

export default MessageList;
