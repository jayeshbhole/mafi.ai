import { useCallback, useEffect, useRef } from "react";
import { GamePhase, PHASE_DURATION, useGameStore } from "../stores/gameStore";

export const useTimer = () => {
  const phase = useGameStore(state => state.phase);
  const timeLeft = useGameStore(state => state.timeLeft);
  const isTimerActive = useGameStore(state => state.isTimerActive);
  const setTimeLeft = useGameStore(state => state.setTimeLeft);
  const setTimerActive = useGameStore(state => state.setTimerActive);

  const timerRef = useRef<NodeJS.Timeout>();

  const startTimer = useCallback(() => {
    setTimerActive(true);
    setTimeLeft(PHASE_DURATION[phase]);
  }, [phase, setTimeLeft, setTimerActive]);

  const stopTimer = useCallback(() => {
    setTimerActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [setTimerActive]);

  const resetTimer = useCallback(
    (newPhase: GamePhase) => {
      setTimeLeft(PHASE_DURATION[newPhase]);
    },
    [setTimeLeft],
  );

  useEffect(() => {
    if (!isTimerActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      const timeLeft = useGameStore.getState().timeLeft;
      if (timeLeft <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setTimeLeft(PHASE_DURATION[phase]);
        return;
      } else {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerActive, phase, setTimeLeft]);

  return {
    timeLeft,
    isTimerActive,
    startTimer,
    stopTimer,
    resetTimer,
  };
};
