import type { GameState, GameSettings, GamePhase } from "@mafia/types/game";
import { MessageType, type GameMessage } from "@mafia/types/rtc";
import { gameDb } from "../db/index.js";
import { randomUUID } from "crypto";

export class GameManager {
  private roomId: string;
  private gameState: GameState;
  private settings: GameSettings;

  constructor(roomId: string, gameState: GameState, settings: GameSettings) {
    console.log(
      "\n🎮 Initializing GameManager",
      {
        roomId,
        playerCount: gameState.players.length,
        settings,
      },
      "\n",
    );

    this.roomId = roomId;
    this.gameState = gameState;
    this.settings = settings;

    // Initialize game state if needed
    if (!this.gameState.votes) {
      this.gameState.votes = {};
      console.log("Initialized votes object\n");
    }
    if (!this.gameState.roles) {
      this.gameState.roles = {};
      console.log("Initialized roles object\n");
    }
  }

  // Player Management
  async handlePlayerReady(playerId: string): Promise<boolean> {
    console.log(
      "\n🎯 Handling player ready state",
      {
        playerId,
        roomId: this.roomId,
      },
      "\n",
    );

    const playerIndex = this.gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      console.log("❌ Player not found in game state", { playerId }, "\n");
      return false;
    }

    console.log(
      "Current player ready state:",
      {
        playerId,
        wasReady: this.gameState.players[playerIndex].isReady,
      },
      "\n",
    );

    this.gameState.players[playerIndex].isReady = true;

    const message: GameMessage = {
      id: randomUUID(),
      timestamp: Date.now(),
      type: MessageType.READY,
      playerId,
      payload: {
        message: "ready",
      },
    };

    console.log("Saving ready message and updating game state...\n");
    await this.saveMessage(message);
    await this.saveGameState();

    console.log(
      "✅ Player ready state updated",
      {
        playerId,
        readyPlayers: this.gameState.players.filter(p => p.isReady).length,
        totalPlayers: this.gameState.players.length,
      },
      "\n",
    );
    return true;
  }

  canStartGame(): boolean {
    const readyPlayers = this.gameState.players.filter(p => p.isReady);
    console.log(
      "\n🎲 Checking if game can start",
      {
        readyPlayers: readyPlayers.length,
        minPlayers: this.settings.minPlayers,
        totalPlayers: this.gameState.players.length,
        readyPlayerIds: readyPlayers.map(p => p.id),
      },
      "\n",
    );
    return readyPlayers.length >= this.settings.minPlayers;
  }

  async startGame(): Promise<void> {
    console.log(
      "\n🎮 Starting game",
      {
        roomId: this.roomId,
        playerCount: this.gameState.players.length,
        readyPlayers: this.gameState.players.filter(p => p.isReady).length,
      },
      "\n",
    );

    this.gameState.phase = "STARTING";
    this.gameState.round = 1;

    const message: GameMessage = {
      id: randomUUID(),
      timestamp: Date.now(),
      type: MessageType.GAME_START,
      playerId: "system",
      payload: {
        timestamp: Date.now(),
      },
    };

    console.log("Saving game start message and updating game state...\n");
    await this.saveMessage(message);
    await this.saveGameState();
    await this.startDay();
    console.log("✅ Game started successfully\n");
  }

  // Phase Management
  private async startDay(): Promise<void> {
    this.gameState.phase = "DAY";

    const message: GameMessage = {
      id: randomUUID(),
      timestamp: Date.now(),
      type: MessageType.PHASE_CHANGE,
      playerId: "system",
      payload: {
        message: "DAY",
      },
    };

    await this.saveMessage(message);
    await this.saveGameState();

    // Start voting phase after day duration
    setTimeout(async () => {
      await this.startVoting();
    }, this.settings.dayDuration * 1000);
  }

  private async startNight(): Promise<void> {
    this.gameState.phase = "NIGHT";

    const message: GameMessage = {
      id: randomUUID(),
      timestamp: Date.now(),
      type: MessageType.PHASE_CHANGE,
      playerId: "system",
      payload: {
        message: "NIGHT",
      },
    };

    await this.saveMessage(message);
    await this.saveGameState();

    // Start day phase after night duration
    setTimeout(async () => {
      this.gameState.round++;
      await this.startDay();
    }, this.settings.nightDuration * 1000);
  }

  private async startVoting(): Promise<void> {
    this.gameState.phase = "VOTING";
    // Initialize votes for current round
    this.gameState.votes[this.gameState.round] = {};

    const message: GameMessage = {
      id: randomUUID(),
      timestamp: Date.now(),
      type: MessageType.PHASE_CHANGE,
      playerId: "system",
      payload: {
        message: "VOTING",
      },
    };

    await this.saveMessage(message);
    await this.saveGameState();

    // Process votes after voting duration
    setTimeout(async () => {
      await this.processVotingResults();
    }, this.settings.votingDuration * 1000);
  }

  // Message Handling
  async handlePlayerMessage(playerId: string, content: string): Promise<boolean> {
    // Only allow messages from alive players during day phase
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || !player.isAlive || this.gameState.phase !== "DAY") {
      return false;
    }

    const message: GameMessage = {
      id: randomUUID(),
      timestamp: Date.now(),
      type: MessageType.CHAT,
      playerId,
      payload: {
        message: content,
      },
    };

    await this.saveMessage(message);
    return true;
  }

  // Voting Management
  async handleVote(voterId: string, targetId: string): Promise<boolean> {
    if (this.gameState.phase !== "VOTING") return false;

    // Check if players are valid and alive
    const voter = this.gameState.players.find(p => p.id === voterId);
    const target = this.gameState.players.find(p => p.id === targetId);
    if (!voter || !target || !voter.isAlive || !target.isAlive) {
      return false;
    }

    // Record vote for current round
    this.gameState.votes[this.gameState.round][voterId] = targetId;

    const message: GameMessage = {
      id: randomUUID(),
      timestamp: Date.now(),
      type: MessageType.VOTE,
      playerId: voterId,
      payload: {
        vote: targetId,
      },
    };

    await this.saveMessage(message);
    await this.saveGameState();
    return true;
  }

  shouldEndVoting(): boolean {
    const currentRoundVotes = this.gameState.votes[this.gameState.round];
    const alivePlayers = this.gameState.players.filter(p => p.isAlive);
    const totalVotes = Object.keys(currentRoundVotes).length;
    return totalVotes >= alivePlayers.length;
  }

  async processVotingResults(): Promise<string | null> {
    const currentRoundVotes = this.gameState.votes[this.gameState.round];
    if (!currentRoundVotes) return null;

    const voteCount: Record<string, number> = {};
    Object.values(currentRoundVotes).forEach(targetId => {
      voteCount[targetId] = (voteCount[targetId] || 0) + 1;
    });

    let maxVotes = 0;
    let eliminatedPlayer: string | null = null;

    for (const [playerId, votes] of Object.entries(voteCount)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        eliminatedPlayer = playerId;
      }
    }

    if (eliminatedPlayer) {
      await this.eliminatePlayer(eliminatedPlayer);
    }

    // Start night phase after voting
    await this.startNight();
    return eliminatedPlayer;
  }

  // Player Elimination
  private async eliminatePlayer(playerId: string): Promise<void> {
    const playerIndex = this.gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      this.gameState.players[playerIndex].isAlive = false;
    }

    const message: GameMessage = {
      id: randomUUID(),
      timestamp: Date.now(),
      type: MessageType.KILL,
      playerId: "system_ai",
      payload: {
        targetId: playerId,
      },
    };

    await this.saveMessage(message);
    await this.saveGameState();
  }

  // Database Operations
  private async saveGameState(): Promise<void> {
    console.log(
      "\n💾 Saving game state",
      {
        roomId: this.roomId,
        phase: this.gameState.phase,
        playerCount: this.gameState.players.length,
        round: this.gameState.round,
        players: this.gameState.players.map(p => ({ id: p.id, isReady: p.isReady })),
      },
      "\n",
    );

    // Update specific fields instead of the entire gameState
    await gameDb.update(
      { roomId: this.roomId },
      {
        $set: {
          phase: this.gameState.phase,
          round: this.gameState.round,
          votes: this.gameState.votes,
          roles: this.gameState.roles,
          updatedAt: Date.now(),
        },
      },
    );

    // Update players array separately to avoid race conditions
    if (this.gameState.players.length > 0) {
      await gameDb.update({ roomId: this.roomId }, { $set: { players: this.gameState.players } });
    }
  }

  private async saveMessage(message: GameMessage): Promise<void> {
    console.log(
      "\n💬 Saving message",
      {
        roomId: this.roomId,
        messageType: message.type,
        playerId: message.playerId,
      },
      "\n",
    );
    await gameDb.update({ roomId: this.roomId }, { $push: { messages: message } });
  }
}
