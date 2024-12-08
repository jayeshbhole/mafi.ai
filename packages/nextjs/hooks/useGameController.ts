import { useCallback, useEffect, useRef } from "react";
import { useSocketStore } from "@/services/socketService";
import { NIGHT_MESSAGES, PHASE_DURATION, useGameStore } from "@/services/store/gameStore";
import { GameMessage, MessageType } from "@mafia/types";

export const useGameController = (gameId: string) => {
  // Game state from store
  const phase = useGameStore(state => state.currentPhase);
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
  const socket = useSocketStore(state => state.socket);

  const timerRef = useRef<NodeJS.Timeout>();

  const transitionToVoting = useCallback(() => {
    setPhase("VOTING");
    setOverlayCard("VOTING");
  }, [setPhase, setOverlayCard]);

  const transitionToResult = useCallback(
    (eliminatedPlayerId: string | undefined) => {
      setPhase("VOTING_RESULT");
      setOverlayCard("VOTING_RESULT");
      setEliminatedPlayer(eliminatedPlayerId);
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
    setTimeLeft(PHASE_DURATION[phase]);
    startTimer();

    return () => stopTimer();
  }, [phase, setTimeLeft, startTimer, stopTimer]);

  useEffect(() => {
    if (!socket) return;
    // Listen for all message types
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
      addMessage(message);
      handlePhaseEnd({
        data: {
          killedPlayer: message.payload.killedPlayer,
          eliminatedPlayerId: message.payload.eliminatedPlayerId,
        },
      });
    });

    socket.on(MessageType.VOTE, (message: GameMessage) => {
      addMessage(message);
      handleVote(message.payload.vote);
    });

    socket.on(MessageType.GAME_START, (message: GameMessage) => {
      addMessage(message);
      transitionToNight();
    });

    socket.on(MessageType.READY, (message: GameMessage) => {
      addMessage(message);
    });
  }, [socket, addMessage, transitionToNight, handlePhaseEnd, handleVote]);

  // Check game end conditions
  const checkGameEnd = useCallback(() => {
    const alivePlayers = players.filter(p => p.isAlive);
    const mafiaCount = alivePlayers.filter(p => p.role === "AI_MAFIA").length;
    const villagerCount = alivePlayers.filter(p => p.role === "VILLAGER").length;

    if (mafiaCount === 0) {
      addMessage({
        playerId: "System",
        payload: {
          message: "🎉 Village wins! All mafia have been eliminated.",
        },
        type: MessageType.SYSTEM_SUCCESS,
      });
      return true;
    }

    if (mafiaCount >= villagerCount) {
      addMessage({
        playerId: "System",
        payload: {
          message: "🎭 Mafia wins! They have taken over the village.",
        },
        type: MessageType.SYSTEM_ALERT,
      });
      return true;
    }

    return false;
  }, [players, addMessage]);

  return {
    // Game state
    phase,
    players,
    overlayCard,
    nightMessage,

    // Game actions
    handleVote,
    checkGameEnd,
    // Phase info
    isNightPhase: phase === "NIGHT",
    isVotingPhase: phase === "VOTING",
    isDayPhase: phase === "DAY",
  };
};
