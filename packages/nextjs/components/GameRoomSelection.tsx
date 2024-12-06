"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";

interface Room {
  id: number;
  name: string;
  players: number;
}

export default function GameRoomSelection() {
  const router = useRouter();
  const [newRoomName, setNewRoomName] = useState("");

  const { data: rooms = [], refetch } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [
        { id: 1, name: "Town Square", players: 5 },
        { id: 2, name: "Midnight Alley", players: 7 },
        { id: 3, name: "Suspicious Cafe", players: 3 },
      ];
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (name: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id: rooms.length + 1, name, players: 1 };
    },
    onSuccess: () => {
      refetch();
      setNewRoomName("");
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return roomId;
    },
    onSuccess: roomId => {
      router.push(`/game/${roomId}`);
    },
  });

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      createRoomMutation.mutate(newRoomName);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Game Rooms</CardTitle>
        <CardDescription>Join a game or create a new one</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rooms.map(room => (
            <Button
              key={room.id}
              variant="outline"
              className="w-full justify-between"
              onClick={() => joinRoomMutation.mutate(room.id)}
              disabled={joinRoomMutation.isPending}
            >
              <span>{room.name}</span>
              <span className="text-sm text-muted-foreground">{room.players} players</span>
            </Button>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Input placeholder="New room name" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
        <Button
          className="w-full"
          onClick={handleCreateRoom}
          disabled={createRoomMutation.isPending || !newRoomName.trim()}
        >
          {createRoomMutation.isPending ? "Creating..." : "Create New Room"}
        </Button>
      </CardFooter>
    </Card>
  );
}
