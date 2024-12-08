"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { roomService } from "../services/roomService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocketStore } from "@/services/socketService";
import { useGameStore } from "@/services/store/gameStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

const RoomSkeleton = () => (
  <Card className="p-4 w-64">
    <Skeleton className="h-6 w-3/4 mb-4" />
    <Skeleton className="h-4 w-1/2 mb-2" />
    <Skeleton className="h-4 w-1/3 mb-4" />
    <Skeleton className="h-10 w-full" />
  </Card>
);

const GameRoomSelection = () => {
  const router = useRouter();
  const { address } = useAccount();

  const playerId = useGameStore(state => state.playerId);
  const setPlayerId = useGameStore(state => state.setPlayerId);

  // Set player ID when address changes
  useEffect(() => {
    if (address) {
      setPlayerId(address);
    }
  }, [address, setPlayerId]);

  // Query active rooms
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["active rooms"],
    queryFn: roomService.getActiveRooms,
  });

  // Join room mutation
  const { mutateAsync: joinRoom, isPending: isJoining } = useMutation({
    mutationKey: ["join room"],
    mutationFn: async (roomId?: string) => {
      if (!address) throw new Error("Not connected");
      if (!roomId) {
        // Create and join a new room if no roomId provided
        const room = await roomService.createRoom({ playerId: address });
        console.log("Created room. Joining", room);
        return room;
      }

      return roomService.joinRoom(roomId, address);
    },
    onSuccess: ({ roomId }) => {
      useSocketStore.getState().sendReady();
      router.push(`/game/${roomId}`);
    },
    onError: error => {
      console.error(error);
    },
  });

  return (
    <div className="grid gap-4 p-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          // Show skeletons while loading
          Array.from({ length: 6 }).map((_, i) => <RoomSkeleton key={i} />)
        ) : !rooms?.length ? (
          // Show message and auto-join if no rooms
          <Card className="p-4 col-span-full text-center w-64">
            <h3 className="text-lg font-bold mb-4">No Active Rooms</h3>
            <Button onClick={() => joinRoom(undefined)} disabled={isJoining}>
              {isJoining ? "Creating Room..." : "Create & Join Room"}
            </Button>
          </Card>
        ) : (
          // Show available rooms
          rooms.map(room => (
            <Card key={room.roomId} className="p-4 w-64">
              <h3 className="text-lg font-bold">Room {room.roomId}</h3>
              <p className="text-sm text-muted-foreground">
                Players: {room.players.length}/{room.settings.maxPlayers}
              </p>
              <p className="text-sm text-muted-foreground">Phase: {room.phase}</p>
              <Button
                className="mt-4 w-full"
                onClick={() => joinRoom(room.roomId)}
                disabled={isJoining || room.players.length >= room.settings.maxPlayers}
              >
                {isJoining ? "Joining..." : "Join Room"}
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default GameRoomSelection;
