import { useCallback, useEffect } from "react";
import { roomService } from "../services/roomService";
import { useGameStore } from "../stores/gameStore";
import { useRTCStore } from "../stores/rtcStore";
import { useDataMessage, useRoom } from "@huddle01/react/hooks";
import type { GameMessage, GamePhase, RTCPayload } from "@mafia/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

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

  const { address } = useAccount();

  // Room connection mutation
  const joinRoomMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Not connected");
      return roomService.joinRoom(roomId, address);
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
    queryFn: () => roomService.getActiveRooms().then(rooms => rooms.find(r => r.roomId === roomId)),
    enabled: !!roomId,
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
            if (message.playerId) {
              voteForPlayer(message.playerId);
            }
            break;
          case "phase_change":
            if (message.payload.message) {
              setPhase(message.payload.message as GamePhase);
            }
            break;
          case "death":
            if (message.playerId) {
              eliminatePlayer(message.playerId);
            }
            break;
          case "chat":
            if (message.payload.message) {
              addMessage(message);
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
