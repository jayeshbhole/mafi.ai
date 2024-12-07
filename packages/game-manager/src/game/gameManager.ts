import { API } from "@huddle01/server-sdk/api";
import { roomsDb } from "../db/index.js";
import { broadcastMessageToRoom } from "../huddle/rtcMessages.js";
import type { GameState, PlayerRole } from "@mafia/types/game";
import type { GameRoom } from "@mafia/types/api";
import type { GameMessage } from "@mafia/types/rtc";

const API_KEY = process.env.HUDDLE01_API_KEY;
if (!API_KEY) throw new Error("HUDDLE01_API_KEY is not set");

const api = new API({
  apiKey: API_KEY,
});

export class GameManager {
  private roomId: string;
  private gameState: GameState;
  private settings: GameRoom["settings"];

  constructor(roomId: string, gameState: GameState, settings: GameRoom["settings"]) {
    this.roomId = roomId;
    this.gameState = gameState;
    this.settings = settings;
  }

  private async broadcastSystemMessage(content: string, metadata = {}) {
    const message: GameMessage = {
      payload: {
        playerId: "system",
        playerName: "system",
        message: {
          sender: "system",
          content,
          type: "system",
        },
      },
      type: "system",
    };

    await this.saveAndBroadcastMessage(message);
  }

  private async saveAndBroadcastMessage(message: GameMessage) {
    // Save to database
    await new Promise<void>((resolve, reject) => {
      roomsDb.update({ roomId: this.roomId }, { $push: { messages: message } }, {}, err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Broadcast via RTC
    await broadcastMessageToRoom(this.roomId, message);
  }

  async handlePlayerMessage(playerId: string, content: string): Promise<boolean> {
    // Check if player is alive
    if (this.gameState.deadPlayers.includes(playerId)) {
      return false;
    }

    // Check if it's day phase
    if (this.gameState.phase !== "DAY") {
      return false;
    }

    const message: GameMessage = {
      payload: {
        playerId,
        playerName: playerId,
        message: {
          sender: playerId,
          content,
          type: "chat",
        },
      },
      type: "chat",
    };

    await this.saveAndBroadcastMessage(message);
    return true;
  }

  async handleVote(voterId: string, targetId: string): Promise<boolean> {
    // Validate vote
    if (
      this.gameState.phase !== "VOTING" ||
      this.gameState.deadPlayers.includes(voterId) ||
      this.gameState.deadPlayers.includes(targetId)
    ) {
      return false;
    }

    // Record vote
    this.gameState.votes[voterId] = targetId;

    const message: GameMessage = {
      payload: {
        playerId: voterId,
        playerName: voterId,
        message: {
          sender: voterId,
          content: `voted for ${targetId}`,
          type: "vote",
        },
      },
      type: "vote",
    };

    await this.saveAndBroadcastMessage(message);

    // Check if we have majority
    await this.checkVotingResults();
    return true;
  }

  private async checkVotingResults() {
    const votes = this.gameState.votes;
    const voteCount: Record<string, number> = {};

    // Count votes
    Object.values(votes).forEach(targetId => {
      voteCount[targetId] = (voteCount[targetId] || 0) + 1;
    });

    // Check for majority
    const aliveCount = this.gameState.alivePlayers.length;
    const majorityNeeded = Math.floor(aliveCount / 2) + 1;

    for (const [targetId, count] of Object.entries(voteCount)) {
      if (count >= majorityNeeded) {
        await this.eliminatePlayer(targetId, "voting");
        await this.startNightPhase();
        break;
      }
    }
  }

  async eliminatePlayer(playerId: string, reason: "voting" | "mafia") {
    // Update game state
    this.gameState.deadPlayers.push(playerId);
    this.gameState.alivePlayers = this.gameState.alivePlayers.filter(p => p !== playerId);

    const message: GameMessage = {
      payload: {
        playerId: "system",
        playerName: "system",
        message: {
          sender: "system",
          content: `${playerId} has been eliminated by ${reason}`,
          type: "death",
        },
      },
      type: "death",
    };

    await this.saveAndBroadcastMessage(message);
    await this.checkGameEnd();
  }

  private async checkGameEnd() {
    const aiMafiaCount = this.gameState.aiPlayers.filter(p => !this.gameState.deadPlayers.includes(p)).length;
    const villagerCount = this.gameState.alivePlayers.filter(p => !this.gameState.aiPlayers.includes(p)).length;

    if (aiMafiaCount >= villagerCount) {
      await this.broadcastSystemMessage("Game Over - AI Mafia wins!");
    } else if (aiMafiaCount === 0) {
      await this.broadcastSystemMessage("Game Over - Villagers win!");
    }
  }

  async startDayPhase() {
    this.gameState.phase = "DAY";
    this.gameState.votes = {};

    await this.broadcastSystemMessage("Day has begun. Players have 2 minutes to discuss.", {
      phase: "DAY",
      round: this.gameState.round,
    });

    // Schedule voting phase
    setTimeout(() => this.startVotingPhase(), 2 * 60 * 1000);
  }

  private async startVotingPhase() {
    this.gameState.phase = "VOTING";
    await this.broadcastSystemMessage("Voting has begun. Cast your votes!", {
      phase: "VOTING",
      round: this.gameState.round,
    });
  }

  private async startNightPhase() {
    this.gameState.phase = "NIGHT";
    this.gameState.round++;

    await this.broadcastSystemMessage("Night has fallen. The Mafia is choosing their target.", {
      phase: "NIGHT",
      round: this.gameState.round,
    });

    // Trigger AI Mafia actions
    await this.handleAIMafiaActions();
  }

  private async handleAIMafiaActions() {
    // Get AI Mafia players
    const aiMafiaPlayers = this.gameState.aiPlayers.filter(
      p => this.gameState.roles[p] === "AI_MAFIA" && !this.gameState.deadPlayers.includes(p),
    );

    if (aiMafiaPlayers.length === 0) return;

    // Simple AI: randomly choose a target
    const possibleTargets = this.gameState.alivePlayers.filter(p => !this.gameState.aiPlayers.includes(p));
    const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

    const message: GameMessage = {
      payload: {
        playerId: aiMafiaPlayers[0], // Use first AI as sender
        playerName: aiMafiaPlayers[0],
        message: {
          sender: aiMafiaPlayers[0],
          content: `eliminated ${target}`,
          type: "ai_action",
        },
      },
      type: "ai_action",
    };

    await this.saveAndBroadcastMessage(message);
    await this.eliminatePlayer(target, "mafia");
    await this.startDayPhase();
  }

  private async assignRoles() {
    const humanPlayers = this.gameState.alivePlayers.filter(p => !this.gameState.aiPlayers.includes(p));
    const totalPlayers = humanPlayers.length + this.settings.aiCount;
    const roles: Record<string, PlayerRole> = {};

    // Create AI players if they don't exist
    for (let i = 0; i < this.settings.aiCount; i++) {
      const aiId = `ai_mafia_${i + 1}`;
      this.gameState.aiPlayers.push(aiId);
      roles[aiId] = "AI_MAFIA";
    }

    // All human players are villagers
    for (const playerId of humanPlayers) {
      roles[playerId] = "VILLAGER";
    }

    this.gameState.roles = roles;

    // Notify human players of their roles
    for (const playerId of humanPlayers) {
      const message: GameMessage = {
        payload: {
          playerId: "system",
          playerName: "system",
          message: {
            sender: "system",
            content: `You are a VILLAGER`,
            type: "system",
          },
        },
        type: "system",
      };

      await this.saveAndBroadcastMessage(message);
    }

    // Announce AI players
    await this.broadcastSystemMessage(`${this.settings.aiCount} AI Mafia players have joined the game.`, {
      phase: "STARTING",
    });
  }

  // Update the chat handler to use the new message type
  async handleChatMessage(playerId: string, content: string): Promise<boolean> {
    // Don't allow AI players to chat
    if (
      this.gameState.aiPlayers.includes(playerId) ||
      (this.gameState.phase !== "LOBBY" &&
        (this.gameState.phase !== "DAY" || this.gameState.deadPlayers.includes(playerId)))
    ) {
      return false;
    }

    const message: GameMessage = {
      payload: {
        playerId: "system",
        playerName: "system",
        message: {
          sender: playerId,
          content,
          type: "chat",
        },
      },
      type: "chat",
    };

    await this.saveAndBroadcastMessage(message);
    return true;
  }

  // Add validation methods
  async validateChatMessage(playerId: string): Promise<boolean> {
    return (
      !this.gameState.aiPlayers.includes(playerId) &&
      (this.gameState.phase === "LOBBY" ||
        (this.gameState.phase === "DAY" && !this.gameState.deadPlayers.includes(playerId)))
    );
  }

  async validateVote(voterId: string, targetId: string): Promise<boolean> {
    return (
      this.gameState.phase === "VOTING" &&
      !this.gameState.deadPlayers.includes(voterId) &&
      !this.gameState.deadPlayers.includes(targetId) &&
      !this.gameState.aiPlayers.includes(voterId)
    );
  }

  async validateReadyStatus(playerId: string): Promise<boolean> {
    return this.gameState.phase === "LOBBY" && !this.gameState.aiPlayers.includes(playerId);
  }

  async handleReadyStatus(playerId: string, ready: boolean): Promise<boolean> {
    // Validate ready status
    if (this.gameState.phase !== "LOBBY" || this.gameState.aiPlayers.includes(playerId)) {
      return false;
    }

    // Update ready status
    if (ready) {
      this.gameState.readyPlayers.add(playerId);
    } else {
      this.gameState.readyPlayers.delete(playerId);
    }

    // Create ready status message
    const message: GameMessage = {
      payload: {
        playerId: "system",
        playerName: "system",
        message: {
          sender: playerId,
          content: ready ? "is ready" : "is not ready",
          type: "ready",
        },
      },
      type: "ready",
    };

    await this.saveAndBroadcastMessage(message);

    // Check if we can start the game
    const readyCount = this.gameState.readyPlayers.size;
    const totalHumanPlayers = this.gameState.alivePlayers.filter(p => !this.gameState.aiPlayers.includes(p)).length;

    if (
      readyCount >= this.settings.minPlayers - this.settings.aiCount && // Account for AI players
      readyCount === totalHumanPlayers &&
      totalHumanPlayers + this.settings.aiCount <= this.settings.maxPlayers
    ) {
      await this.startGame();
    }

    return true;
  }

  private async startGame() {
    this.gameState.phase = "STARTING";

    await this.broadcastSystemMessage("Game is starting! Assigning roles...", { phase: "STARTING" });

    // Assign roles
    await this.assignRoles();

    // Start first night phase after a short delay
    setTimeout(() => this.startNightPhase(), 5000);
  }
}
