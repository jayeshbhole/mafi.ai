import { Message, Player } from "../stores/gameStore";

// Simulate API delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const gameService = {
  // Simulate fetching game state
  fetchGameState: async (gameId: string) => {
    await delay(1000);
    return {
      gameId,
      status: "active",
    };
  },

  // Simulate mafia decision
  getMafiaKill: async (players: Player[]): Promise<string> => {
    await delay(2000);
    const alivePlayers = players.filter(p => p.isAlive && p.role !== "mafia");
    return alivePlayers[Math.floor(Math.random() * alivePlayers.length)].name;
  },

  // Simulate sending a message
  sendMessage: async (message: Omit<Message, "id" | "timestamp">) => {
    await delay(500);
    return {
      ...message,
      id: Date.now(),
      timestamp: Date.now(),
    };
  },

  // Simulate vote submission
  submitVote: async (playerName: string, gameId: string) => {
    await delay(500);
    return {
      playerName,
      success: true,
    };
  },

  // Simulate AI player messages
  getAIResponse: async (
    phase: string,
    context: {
      players: Player[];
      recentMessages: Message[];
    },
  ): Promise<Message> => {
    await delay(1000);

    // Simulate AI player responses based on phase and context
    if (phase === "day") {
      const suspectPlayer = context.players.find(p => p.isAlive && !p.votes);
      return {
        id: Date.now(),
        sender: "Alice",
        content: suspectPlayer
          ? `I think ${suspectPlayer.name} is acting suspicious.`
          : "We need to be careful who we trust.",
        type: "chat",
        timestamp: Date.now(),
      };
    }

    return {
      id: Date.now(),
      sender: "Alice",
      content: "Let's think carefully about this.",
      type: "chat",
      timestamp: Date.now(),
    };
  },
};

export type GameService = typeof gameService;
