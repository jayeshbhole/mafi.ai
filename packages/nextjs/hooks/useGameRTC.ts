import { useCallback, useEffect } from "react";
import { useGameStore } from "../stores/gameStore";
import { useDataMessage, useRoom } from "@huddle01/react/hooks";

type GameMessage = {
  type: "vote" | "phase" | "eliminate" | "chat";
  payload: any;
};

export const useGameRTC = (roomId: string) => {
  const { joinRoom } = useRoom();
  const { sendData } = useDataMessage<GameMessage>();

  // Game state actions
  const setPhase = useGameStore(state => state.setPhase);
  const voteForPlayer = useGameStore(state => state.voteForPlayer);
  const eliminatePlayer = useGameStore(state => state.eliminatePlayer);
  const addMessage = useGameStore(state => state.addMessage);

  // Handle incoming messages
  const handleMessage = useCallback(
    (message: GameMessage) => {
      switch (message.type) {
        case "vote":
          voteForPlayer(message.payload.playerName);
          break;
        case "phase":
          setPhase(message.payload.phase);
          break;
        case "eliminate":
          eliminatePlayer(message.payload.playerName);
          break;
        case "chat":
          addMessage(message.payload);
          break;
      }
    },
    [voteForPlayer, setPhase, eliminatePlayer, addMessage],
  );

  // Connect to RTC room
  useEffect(() => {
    joinRoom({
      roomId,
      token: "YOUR_TOKEN", // You'll need to get this from your backend
    });
  }, [joinRoom, roomId]);

  // Listen for incoming messages
  useDataMessage<GameMessage>({
    onMessage: handleMessage,
  });

  // Broadcast functions
  const broadcastVote = useCallback(
    (playerName: string) => {
      sendData({
        type: "vote",
        payload: { playerName },
      });
    },
    [sendData],
  );

  const broadcastPhase = useCallback(
    (phase: GamePhase) => {
      sendData({
        type: "phase",
        payload: { phase },
      });
    },
    [sendData],
  );

  const broadcastElimination = useCallback(
    (playerName: string) => {
      sendData({
        type: "eliminate",
        payload: { playerName },
      });
    },
    [sendData],
  );

  const broadcastMessage = useCallback(
    (message: Omit<Message, "id" | "timestamp">) => {
      sendData({
        type: "chat",
        payload: message,
      });
    },
    [sendData],
  );

  return {
    broadcastVote,
    broadcastPhase,
    broadcastElimination,
    broadcastMessage,
  };
};
