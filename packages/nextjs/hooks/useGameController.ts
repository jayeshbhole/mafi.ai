import { useCallback, useEffect, useRef } from "react";
import { useSocketStore } from "@/services/socketService";
import { NIGHT_MESSAGES, PHASE_DURATION, useGameStore } from "@/services/store/gameStore";
import { GameMessage, MessageType } from "@mafia/types";
import type { GameState } from "@mafia/types/game";

interface PhaseChangePayload {
  killedPlayer?: string;
  eliminatedPlayerId?: string;
}

interface VotePayload {
  vote: string;
}

interface ReadyPayload {
  message: "ready" | "notReady";
}

interface GameStartPayload {
  timestamp: number;
}

interface GameStatePayload {
  gameState: GameState;
  messages: GameMessage[];
}

type TypedGameMessage<T> = Omit<GameMessage, "payload"> & {
  payload: T;
};

export const useGameController = (gameId: string) => {
  // Game state from store
  const phase = useGameStore(state => state.phase);
  const players = useGameStore(state => state.players);
  const overlayCard = useGameStore(state => state.overlayCard);
  const nightMessage = useGameStore(state => state.nightMessage);
  const addMessage = useGameStore(state => state.addMessage);
  const voteForPlayer = useGameStore(state => state.voteForPlayer);
  const resetVotes = useGameStore(state => state.resetVotes);
  const setEliminatedPlayer = useGameStore(state => state.setEliminatedPlayer);
  const setPhase = useGameStore(state => state.setPhase);
  const setOverlayCard = useGameStore(state => state.setOverlayCard);
  const setNightMessage = useGameStore(state => state.setNightMessage);
  const setTimeLeft = useGameStore(state => state.setTimeLeft);
  const setKilledPlayer = useGameStore(state => state.setKilledPlayer);
  const updatePlayer = useGameStore(state => state.updatePlayer);
  const setPlayers = useGameStore(state => state.setPlayers);
  const socket = useSocketStore(state => state.socket);

  const timerRef = useRef<NodeJS.Timeout>();

  // Set overlay card when phase changes
  useEffect(() => {
    if (phase === "LOBBY") {
      setOverlayCard("LOBBY");
    }
  }, [phase, setOverlayCard]);

  const transitionToVoting = useCallback(() => {
    setPhase("VOTING");
    setOverlayCard("VOTING");
  }, [setPhase, setOverlayCard]);

  const transitionToResult = useCallback(
    (eliminatedPlayerId: string | undefined) => {
      setPhase("VOTING_RESULT");
      setOverlayCard("VOTING_RESULT");
      if (eliminatedPlayerId) {
        setEliminatedPlayer(eliminatedPlayerId);
      }
    },
    [setPhase, setOverlayCard, setEliminatedPlayer],
  );

  const transitionToNight = useCallback(() => {
    setPhase("NIGHT");
    setOverlayCard("NIGHT");
    setNightMessage(NIGHT_MESSAGES[Math.floor(Math.random() * NIGHT_MESSAGES.length)]);

    const votedOutPlayer = players.reduce(
      (prev, current) => (!prev || (current.votes || 0) > (prev.votes || 0) ? current : prev),
      players[0],
    );
    setEliminatedPlayer(votedOutPlayer.name);
    resetVotes();
  }, [players, setPhase, setOverlayCard, setNightMessage, setEliminatedPlayer, resetVotes]);

  const transitionToDay = useCallback(
    (killedPlayer: string | undefined) => {
      if (killedPlayer) {
        // Show death overlay first
        setOverlayCard("DEATH");
        setKilledPlayer(killedPlayer);

        // After 5 seconds, transition to day phase
        setTimeout(() => {
          setOverlayCard(null);
          setPhase("DAY");
          setKilledPlayer(null);
        }, 5000);
      } else {
        setOverlayCard(null);
        setPhase("DAY");
      }
    },
    [setPhase, setOverlayCard, setKilledPlayer],
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  // Phase end handler
  const handlePhaseEnd = useCallback(
    ({ data }: { data: { killedPlayer?: string; eliminatedPlayerId?: string } }) => {
      stopTimer();

      switch (phase) {
        case "DAY":
          transitionToVoting();
          break;
        case "VOTING":
          transitionToResult(data.eliminatedPlayerId);
          break;
        case "VOTING_RESULT":
          transitionToNight();
          break;
        case "NIGHT":
          transitionToDay(data.killedPlayer);
          break;
      }
    },
    [phase, transitionToVoting, transitionToResult, transitionToNight, transitionToDay, stopTimer],
  );

  // Vote handler
  const handleVote = useCallback(
    (playerName: string) => {
      voteForPlayer(playerName);
    },
    [voteForPlayer],
  );

  // Timer control functions
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      const timeLeft = useGameStore.getState().timeLeft;
      if (timeLeft <= 0) {
        handlePhaseEnd({
          data: {},
        });
      } else {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);
  }, [handlePhaseEnd, setTimeLeft]);

  // Start timer when phase changes
  useEffect(() => {
    if (phase !== "LOBBY") {
      setTimeLeft(PHASE_DURATION[phase]);
      startTimer();
    }

    return () => stopTimer();
  }, [phase, setTimeLeft, startTimer, stopTimer]);

  useEffect(() => {
    if (!socket) return;

    socket.on(MessageType.CHAT, (message: GameMessage) => {
      addMessage(message);
    });

    socket.on(MessageType.SYSTEM_CHAT, (message: GameMessage) => {
      addMessage(message);
    });

    socket.on(MessageType.SYSTEM_ALERT, (message: GameMessage) => {
      addMessage(message);
    });

    socket.on(MessageType.PHASE_CHANGE, (message: GameMessage) => {
      if (message.type === MessageType.PHASE_CHANGE) {
        addMessage(message);
        handlePhaseEnd({
          data: {
            killedPlayer: message.payload.killedPlayer,
            eliminatedPlayerId: message.payload.eliminatedPlayer,
          },
        });
      }
    });

    socket.on(MessageType.VOTE, (message: GameMessage) => {
      if (message.type === MessageType.VOTE) {
        addMessage(message);
        handleVote(message.payload.vote);
      }
    });

    socket.on(MessageType.GAME_START, (message: GameMessage) => {
      addMessage(message);
      setPhase("STARTING");
      setTimeout(() => {
        transitionToNight();
      }, PHASE_DURATION.STARTING * 1000);
    });

    socket.on(MessageType.READY, (message: GameMessage) => {
      if (message.type === MessageType.READY) {
        addMessage(message);
        updatePlayer(message.playerId, { isReady: true });
      }
    });

    // Handle game state updates
    socket.on("game-state", ({ gameState }: GameStatePayload) => {
      // Update local game state
      setPhase(gameState.phase);
      setPlayers(gameState.players);

      // If there are messages, add them
      if (gameState.messages?.length) {
        gameState.messages.forEach(message => {
          addMessage(message);
        });
      }
    });

    return () => {
      socket.off(MessageType.CHAT);
      socket.off(MessageType.SYSTEM_CHAT);
      socket.off(MessageType.SYSTEM_ALERT);
      socket.off(MessageType.PHASE_CHANGE);
      socket.off(MessageType.VOTE);
      socket.off(MessageType.GAME_START);
      socket.off(MessageType.READY);
      socket.off("game-state");
    };
  }, [socket, addMessage, transitionToNight, handlePhaseEnd, handleVote, setPhase, updatePlayer, setPlayers]);

  return {
    phase,
    players,
    overlayCard,
    nightMessage,
    handleVote,
  };
};
