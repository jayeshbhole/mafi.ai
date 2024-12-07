import { useCallback, useEffect } from "react";
import { useGameStore } from "../stores/gameStore";
import { useRTCStore } from "../stores/rtcStore";
import { useDataMessage, useRoom } from "@huddle01/react/hooks";
import type { GameMessage, GamePhase, RTCPayload } from "@mafia/types";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGameRTC = (roomId: string) => {
  const { joinRoom, room } = useRoom();

  // RTC state
  const setRoomId = useRTCStore(state => state.setRoomId);
  const setRoom = useRTCStore(state => state.setRoom);
  const setConnected = useRTCStore(state => state.setConnected);
  const setError = useRTCStore(state => state.setError);

  // Game state actions
  const setPhase = useGameStore(state => state.setPhase);
  const voteForPlayer = useGameStore(state => state.voteForPlayer);
  const eliminatePlayer = useGameStore(state => state.eliminatePlayer);
  const addMessage = useGameStore(state => state.addMessage);

  // Room connection mutation
  const joinRoomMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`localhost:9999/api/rtc/join-room/${roomId}`);
      if (!response.ok) throw new Error("Failed to join room");
      return response.json();
    },
    onSuccess: async ({ token }) => {
      await joinRoom({ roomId, token });
      setRoomId(roomId);
      setConnected(true);
    },
    onError: error => {
      console.error("Failed to join room:", error);
      setError("Failed to join room");
      setConnected(false);
    },
  });

  // Room state query
  const { data: roomData } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const response = await fetch(`/api/rtc/room/${roomId}`);
      if (!response.ok) throw new Error("Failed to fetch room");
      return response.json();
    },
    enabled: !!roomId && room !== null,
  });

  // Update room state when it changes
  useEffect(() => {
    if (room) {
      setRoom(room);
    }
  }, [room, setRoom]);

  // Connect to RTC room
  useEffect(() => {
    joinRoomMutation.mutate();

    return () => {
      setRoomId(null);
      setConnected(false);
    };
  }, [joinRoomMutation, roomId, setConnected, setRoomId]);

  // Handle incoming messages
  const handleMessage = useCallback(
    (payload: string) => {
      try {
        const message = JSON.parse(payload) as GameMessage;
        switch (message.type) {
          case "vote":
            if (message.payload.playerId) {
              voteForPlayer(message.payload.playerId);
            }
            break;
          case "phase":
            if (message.payload.message) {
              setPhase(message.payload.message.content as GamePhase);
            }
            break;
          case "eliminate":
            if (message.payload.playerId) {
              eliminatePlayer(message.payload.playerId);
            }
            break;
          case "chat":
            if (message.payload.message) {
              addMessage(message.payload.message);
            }
            break;
        }
      } catch (error) {
        console.error("Failed to parse message:", error);
        setError("Failed to parse message");
      }
    },
    [voteForPlayer, setPhase, eliminatePlayer, addMessage, setError],
  );

  // Listen for incoming messages
  const { sendData } = useDataMessage({
    onMessage: handleMessage,
  });

  // Message sending mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (payload: RTCPayload) => {
      sendData(payload);
    },
    onError: error => {
      console.error("Failed to send message:", error);
      setError("Failed to send message");
    },
  });

  return {
    room: roomData,
    isConnecting: joinRoomMutation.isPending,
    isError: joinRoomMutation.isError,
    error: joinRoomMutation.error,
    sendMessage: sendMessageMutation.mutate,
  };
};
