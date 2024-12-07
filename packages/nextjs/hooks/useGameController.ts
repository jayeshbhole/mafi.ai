import { useCallback } from "react";
import { gameService } from "../services/gameService";
import { NIGHT_MESSAGES, PHASE_DURATION, useGameStore } from "../stores/gameStore";
import { useTimer } from "./useTimer";
import { useMutation } from "@tanstack/react-query";

export const useGameController = (gameId: string) => {
  // Game state from store
  const phase = useGameStore(state => state.phase);
  const players = useGameStore(state => state.players);
  const messages = useGameStore(state => state.messages);
  const overlayCard = useGameStore(state => state.overlayCard);
  const nightMessage = useGameStore(state => state.nightMessage);
  const addMessage = useGameStore(state => state.addMessage);
  const voteForPlayer = useGameStore(state => state.voteForPlayer);
  const resetVotes = useGameStore(state => state.resetVotes);
  const eliminatePlayer = useGameStore(state => state.eliminatePlayer);
  const setPhase = useGameStore(state => state.setPhase);
  const setOverlayCard = useGameStore(state => state.setOverlayCard);
  const setNightMessage = useGameStore(state => state.setNightMessage);

  // Timer controls
  const { timeLeft, startTimer, stopTimer, resetTimer } = useTimer();

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

  // Phase transition handlers
  const transitionToVoting = useCallback(() => {
    setPhase("voting");
    setOverlayCard("voting");
    addMessage({
      sender: "System",
      content: "🗳️ Time to vote! Choose wisely...",
      type: "system",
    });
    resetTimer("voting");
    startTimer();
  }, [setPhase, setOverlayCard, addMessage, resetTimer, startTimer]);

  const transitionToNight = useCallback(() => {
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
    resetTimer("night");
    setNightMessage(NIGHT_MESSAGES[Math.floor(Math.random() * NIGHT_MESSAGES.length)]);
    startTimer();
    resetVotes();

    // Trigger mafia kill
    mafiaKillMutation.mutate();
  }, [
    players,
    setPhase,
    setOverlayCard,
    setNightMessage,
    addMessage,
    resetVotes,
    mafiaKillMutation,
    resetTimer,
    startTimer,
  ]);

  const transitionToDay = useCallback(() => {
    setOverlayCard(null);
    setPhase("day");
    resetTimer("day");
    startTimer();

    // Trigger AI responses
    aiResponseMutation.mutate();
  }, [setPhase, setOverlayCard, resetTimer, startTimer, aiResponseMutation]);

  // Phase end handler
  const handlePhaseEnd = useCallback(() => {
    stopTimer();

    switch (phase) {
      case "day":
        transitionToVoting();
        break;
      case "voting":
        transitionToNight();
        break;
      case "night":
        transitionToDay();
        break;
    }
  }, [phase, transitionToVoting, transitionToNight, transitionToDay, stopTimer]);

  // Vote handler
  const handleVote = useCallback(
    (playerName: string) => {
      voteMutation.mutate(playerName);
    },
    [voteMutation],
  );

  // Message handler
  const handleMessage = useCallback(
    (content: string) => {
      addMessage({
        sender: "You",
        content,
        type: "chat",
      });
    },
    [addMessage],
  );

  // Check game end conditions
  const checkGameEnd = useCallback(() => {
    const alivePlayers = players.filter(p => p.isAlive);
    const mafiaCount = alivePlayers.filter(p => p.role === "mafia").length;
    const villagerCount = alivePlayers.filter(p => p.role === "villager").length;

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
    timeLeft,
    players,
    messages,
    overlayCard,
    nightMessage,

    // Game actions
    handlePhaseEnd,
    handleVote,
    handleMessage,
    checkGameEnd,

    // Phase info
    isNightPhase: phase === "night",
    isVotingPhase: phase === "voting",
    isDayPhase: phase === "day",

    // Phase durations
    phaseDuration: PHASE_DURATION[phase],
  };
};
