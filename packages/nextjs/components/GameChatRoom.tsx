"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gameService } from "../services/gameService";
import { NIGHT_MESSAGES, PHASE_DURATION, useGameStore } from "../stores/gameStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Moon, Skull, Sun, Users } from "lucide-react";

export default function GameChatRoom({ gameId }: { gameId: string }) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  // Zustand state
  const {
    phase,
    timeLeft,
    isTimerActive,
    players,
    messages,
    overlayCard,
    nightMessage,
    setPhase,
    setTimeLeft,
    setTimerActive,
    setOverlayCard,
    setNightMessage,
    addMessage,
    voteForPlayer,
    resetVotes,
    eliminatePlayer,
  } = useGameStore();

  // Queries and Mutations
  const { data: gameState } = useQuery({
    queryKey: ["gameState", gameId],
    queryFn: () => gameService.fetchGameState(gameId),
  });

  const sendMessageMutation = useMutation({
    mutationFn: gameService.sendMessage,
    onSuccess: message => {
      addMessage(message);
    },
  });

  const voteMutation = useMutation({
    mutationFn: (playerName: string) => gameService.submitVote(playerName, gameId),
    onSuccess: (_, playerName) => {
      voteForPlayer(playerName);
      addMessage({
        sender: "System",
        content: `You voted for ${playerName}`,
        type: "system-success",
      });
    },
  });

  const mafiaKillMutation = useMutation({
    mutationFn: () => gameService.getMafiaKill(players),
    onSuccess: killedPlayer => {
      eliminatePlayer(killedPlayer);
      addMessage({
        sender: "System",
        content: `🌅 Dawn breaks...\n\n💀 ${killedPlayer} was found dead this morning!`,
        type: "system-alert",
      });
    },
  });

  const aiResponseMutation = useMutation({
    mutationFn: () =>
      gameService.getAIResponse(phase, {
        players,
        recentMessages: messages.slice(-5),
      }),
    onSuccess: message => {
      addMessage(message);
    },
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Timer effect
  useEffect(() => {
    if (!isTimerActive) return;

    const handlePhaseEnd = () => {
      setTimerActive(false);

      if (phase === "day") {
        setPhase("voting");
        setOverlayCard("voting");
        addMessage({
          sender: "System",
          content: "🗳️ Time to vote! Choose wisely...",
          type: "system",
        });
        setTimeLeft(PHASE_DURATION.voting);
        setTimerActive(true);
      } else if (phase === "voting") {
        const voteResults = players
          .filter(p => p.votes && p.votes > 0)
          .map(p => `${p.name}: ${p.votes} votes`)
          .join("\n");

        addMessage({
          sender: "System",
          content: `📊 Vote Results:\n${voteResults}`,
          type: "system-alert",
        });

        setOverlayCard("night");
        setPhase("night");
        setTimeLeft(PHASE_DURATION.night);
        setNightMessage(NIGHT_MESSAGES[Math.floor(Math.random() * NIGHT_MESSAGES.length)]);
        setTimerActive(true);
        resetVotes();

        // Trigger mafia kill after voting
        mafiaKillMutation.mutate();
      } else if (phase === "night") {
        setOverlayCard(null);
        setPhase("day");
        setTimeLeft(PHASE_DURATION.day);
        setTimerActive(true);

        // Trigger AI responses in day phase
        aiResponseMutation.mutate();
      }
    };

    const timer = setInterval(() => {
      const prev = useGameStore.getState().timeLeft;
      if (prev <= 0) {
        clearInterval(timer);
        handlePhaseEnd();
      } else {
        setTimeLeft(prev - 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    addMessage,
    aiResponseMutation,
    isTimerActive,
    mafiaKillMutation,
    phase,
    players,
    resetVotes,
    setNightMessage,
    setOverlayCard,
    setPhase,
    setTimeLeft,
    setTimerActive,
  ]);

  // Get phase-specific styles
  const getPhaseStyles = () => {
    switch (phase) {
      case "day":
        return {
          background: "bg-background",
          icon: <Sun className="w-6 h-6" />,
          timerColor: "from-primary/20 to-primary/5",
          headerBg: "bg-card",
        };
      case "night":
        return {
          background: "bg-background",
          icon: <Moon className="w-6 h-6" />,
          timerColor: "from-secondary/20 to-secondary/5",
          headerBg: "bg-card",
        };
      case "voting":
        return {
          background: "bg-background",
          icon: <Users className="w-6 h-6" />,
          timerColor: "from-destructive/20 to-destructive/5",
          headerBg: "bg-card",
        };
      default:
        return {
          background: "bg-background",
          icon: null,
          timerColor: "from-primary/20 to-primary/5",
          headerBg: "bg-card",
        };
    }
  };

  const phaseStyles = getPhaseStyles();

  const handleVote = (playerName: string) => {
    voteMutation.mutate(playerName);
  };

  const handleSend = () => {
    if (input.trim()) {
      sendMessageMutation.mutate({
        sender: "You",
        content: input.trim(),
        type: "chat",
      });
      setInput("");
    }
  };

  return (
    <>
      <div className={`min-h-screen w-full p-8 transition-colors duration-1000 ${phaseStyles.background}`}>
        <div className="max-w-[500px] mx-auto relative">
          {overlayCard && (
            <div className="absolute inset-0 z-10 animate-in fade-in zoom-in duration-300">
              <Card
                className={`w-full h-full flex flex-col items-center justify-center text-white
                ${
                  overlayCard === "night"
                    ? "bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900"
                    : "bg-gradient-to-br from-rose-900 via-red-900 to-rose-900"
                }`}
              >
                {/* Timer bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-white/30 transition-all duration-1000 ease-linear"
                    style={{
                      width: `${(timeLeft / PHASE_DURATION[overlayCard]) * 100}%`,
                    }}
                  />
                </div>

                {overlayCard === "night" ? (
                  <>
                    <Moon className="w-24 h-24 mb-8 text-indigo-300 animate-pulse" />
                    <CardTitle className="text-2xl mb-4 text-center">Night Falls</CardTitle>
                    <p className="text-lg text-center px-6 text-indigo-200 animate-in slide-in-from-bottom duration-500">
                      {nightMessage}
                    </p>
                  </>
                ) : (
                  <>
                    <Users className="w-24 h-24 mb-8 text-red-300 animate-pulse" />
                    <CardTitle className="text-2xl mb-4 text-center">Time to Vote</CardTitle>
                    <div className="w-full max-w-sm space-y-4 p-6">
                      {players
                        .filter(p => p.isAlive)
                        .map(player => (
                          <Button
                            key={player.name}
                            variant="outline"
                            className="w-full h-12 bg-white/10 hover:bg-white/20 border-white/20 text-white flex justify-between items-center"
                            onClick={() => handleVote(player.name)}
                          >
                            <span className="font-medium">{player.name}</span>
                            {player.votes ? (
                              <span className="px-2 py-1 rounded-full bg-white/20 text-sm">{player.votes} votes</span>
                            ) : null}
                          </Button>
                        ))}
                    </div>
                  </>
                )}
              </Card>
            </div>
          )}

          <Card
            className={`w-full h-[800px] flex flex-col ${overlayCard ? "opacity-0" : "opacity-100"} transition-opacity duration-500`}
          >
            <div className="relative">
              {/* Large background timer */}
              <div className="absolute inset-0 overflow-hidden rounded-t-lg">
                <div
                  className={`h-full bg-gradient-to-r ${phaseStyles.timerColor} transition-all duration-1000 ease-linear`}
                  style={{
                    width: `${(timeLeft / PHASE_DURATION[phase]) * 100}%`,
                  }}
                />
              </div>

              {/* Header content */}
              <CardHeader className="space-y-2 relative z-10">
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {phaseStyles.icon}
                    <span>Game Room {gameId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-normal">
                    {phase === "night" && <Skull className="w-4 h-4" />}
                    {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase: {timeLeft}s
                  </div>
                </CardTitle>

                <div className="flex flex-wrap gap-2 text-sm">
                  {players.map(player => (
                    <span
                      key={player.name}
                      className={`px-2 py-1 rounded-full ${
                        player.isAlive ? "bg-secondary" : "bg-destructive text-destructive-foreground"
                      }`}
                    >
                      {player.name} {!player.isAlive && "☠️"}
                      {player.votes ? ` (${player.votes})` : ""}
                    </span>
                  ))}
                </div>
              </CardHeader>
            </div>

            <CardContent className="flex-grow overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-4">
                  {messages.map(message => (
                    <div key={message.id} className="animate-in slide-in-from-bottom duration-300">
                      <div className={`flex ${message.sender === "You" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`relative max-w-[80%] p-4 shadow-md ${
                            message.type?.startsWith("system")
                              ? "bg-destructive/20 text-destructive-foreground border-2 border-destructive font-medium rounded-lg mx-auto text-center"
                              : message.sender === "You"
                                ? "bg-primary text-primary-foreground rounded-[20px] rounded-br-none"
                                : "bg-secondary rounded-[20px] rounded-bl-none"
                          }`}
                        >
                          <p className="font-semibold mb-1">{message.sender}</p>
                          <p className="whitespace-pre-line">{message.content}</p>
                          {message.type !== "system" && (
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
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
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
                  disabled={phase === "night"}
                />
                <Button onClick={handleSend} disabled={!input.trim() || phase === "night"}>
                  Send
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
