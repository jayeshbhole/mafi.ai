import { useCallback, useEffect, useRef } from "react";
import { gameService } from "../services/gameService";
import { NIGHT_MESSAGES, PHASE_DURATION, useGameStore } from "../stores/gameStore";
import { useMutation } from "@tanstack/react-query";

export const useGameController = (gameId: string) => {
  // Game state from store
  const phase = useGameStore(state => state.phase);
  const players = useGameStore(state => state.players);
  const overlayCard = useGameStore(state => state.overlayCard);
  const nightMessage = useGameStore(state => state.nightMessage);
  const addMessage = useGameStore(state => state.addMessage);
  const voteForPlayer = useGameStore(state => state.voteForPlayer);
  const resetVotes = useGameStore(state => state.resetVotes);
  const eliminatePlayer = useGameStore(state => state.eliminatePlayer);
  const setPhase = useGameStore(state => state.setPhase);
  const setOverlayCard = useGameStore(state => state.setOverlayCard);
  const setNightMessage = useGameStore(state => state.setNightMessage);
  const setTimeLeft = useGameStore(state => state.setTimeLeft);
  const setKilledPlayer = useGameStore(state => state.setKilledPlayer);
  const timerRef = useRef<NodeJS.Timeout>();

  // Mutations
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

  // Phase transition handlers
  const transitionToVoting = useCallback(() => {
    setPhase("VOTING");
    setOverlayCard("VOTING");
  }, [setPhase, setOverlayCard]);

  const transitionToResult = useCallback(() => {
    setPhase("RESULT");
    setOverlayCard("RESULT");
  }, [setPhase, setOverlayCard]);

  const transitionToNight = useCallback(() => {
    setPhase("NIGHT");
    setOverlayCard("NIGHT");
    setNightMessage(NIGHT_MESSAGES[Math.floor(Math.random() * NIGHT_MESSAGES.length)]);

    const votedOutPlayer = players.reduce(
      (prev, current) => (!prev || (current.votes || 0) > (prev.votes || 0) ? current : prev),
      players[0],
    );
    eliminatePlayer(votedOutPlayer.name);
    resetVotes();
  }, [players, setPhase, setOverlayCard, setNightMessage, eliminatePlayer, resetVotes]);

  const transitionToDay = useCallback(() => {
    if (mafiaKillMutation.data) {
      // Show death overlay first
      setOverlayCard("DEATH");
      setKilledPlayer(mafiaKillMutation.data);

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
  }, [setPhase, setOverlayCard, setKilledPlayer, mafiaKillMutation.data]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  // Phase end handler
  const handlePhaseEnd = useCallback(() => {
    stopTimer();

    switch (phase) {
      case "DAY":
        transitionToVoting();
        break;
      case "VOTING":
        transitionToResult();
        break;
      case "RESULT":
        transitionToNight();
        break;
      case "NIGHT":
        transitionToDay();
        break;
    }
  }, [phase, transitionToVoting, transitionToResult, transitionToNight, transitionToDay, stopTimer]);

  // Vote handler
  const handleVote = useCallback(
    (playerName: string) => {
      voteMutation.mutate(playerName);
    },
    [voteMutation],
  );

  // Timer control functions
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      const timeLeft = useGameStore.getState().timeLeft;
      if (timeLeft <= 0) {
        handlePhaseEnd();
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

  // Check game end conditions
  const checkGameEnd = useCallback(() => {
    const alivePlayers = players.filter(p => p.isAlive);
    const mafiaCount = alivePlayers.filter(p => p.role === "AI_MAFIA").length;
    const villagerCount = alivePlayers.filter(p => p.role === "VILLAGER").length;

    if (mafiaCount === 0) {
      addMessage({
        sender: "System",
        content: "🎉 Village wins! All mafia have been eliminated.",
        type: "system-success",
      });
      return true;
    }

    if (mafiaCount >= villagerCount) {
      addMessage({
        sender: "System",
        content: "🎭 Mafia wins! They have taken over the village.",
        type: "system-alert",
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
