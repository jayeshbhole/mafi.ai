"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { roomService } from "../services/roomService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

const RoomSkeleton = () => (
  <Card className="p-4">
    <Skeleton className="h-6 w-3/4 mb-4" />
    <Skeleton className="h-4 w-1/2 mb-2" />
    <Skeleton className="h-4 w-1/3 mb-4" />
    <Skeleton className="h-10 w-full" />
  </Card>
);

export const GameRoomSelection = () => {
  const router = useRouter();
  const { address } = useAccount();

  // Query active rooms
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: roomService.getActiveRooms,
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: roomService.createRoom,
    onSuccess: room => {
      joinRoom(room.roomId);
    },
  });

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: async (roomId?: string) => {
      if (!address) throw new Error("Not connected");
      if (!roomId) {
        // Create and join a new room if no roomId provided
        const room = await roomService.createRoom();
        return roomService.joinRoom(room.roomId, address);
      }
      return roomService.joinRoom(roomId, address);
    },
    onSuccess: ({ roomId }) => {
      router.push(`/game?roomId=${roomId}`);
    },
  });

  const joinRoom = useCallback(
    (roomId?: string) => {
      if (!address) return;
      joinRoomMutation.mutate(roomId);
    },
    [address, joinRoomMutation],
  );

  const createRoom = useCallback(() => {
    if (!address) return;
    createRoomMutation.mutate();
  }, [address, createRoomMutation]);

  return (
    <div className="grid gap-4 p-4">
      <Button onClick={createRoom} disabled={createRoomMutation.isPending}>
        {createRoomMutation.isPending ? "Creating..." : "Create New Room"}
      </Button>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          // Show skeletons while loading
          Array.from({ length: 6 }).map((_, i) => <RoomSkeleton key={i} />)
        ) : !rooms?.length ? (
          // Show message and auto-join if no rooms
          <Card className="p-4 col-span-full text-center">
            <h3 className="text-lg font-bold mb-4">No Active Rooms</h3>
            <Button onClick={() => joinRoom()} disabled={joinRoomMutation.isPending}>
              {joinRoomMutation.isPending ? "Creating Room..." : "Create & Join Room"}
            </Button>
          </Card>
        ) : (
          // Show available rooms
          rooms.map(room => (
            <Card key={room.roomId} className="p-4">
              <h3 className="text-lg font-bold">Room {room.roomId}</h3>
              <p className="text-sm text-muted-foreground">
                Players: {room.players.length}/{room.settings.maxPlayers}
              </p>
              <p className="text-sm text-muted-foreground">Phase: {room.gameState.phase}</p>
              <Button
                className="mt-4 w-full"
                onClick={() => joinRoom(room.roomId)}
                disabled={joinRoomMutation.isPending || room.players.length >= room.settings.maxPlayers}
              >
                {joinRoomMutation.isPending ? "Joining..." : "Join Room"}
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
