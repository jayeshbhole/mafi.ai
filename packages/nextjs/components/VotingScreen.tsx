"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation, useQuery } from "@tanstack/react-query";

interface Player {
  id: number;
  name: string;
  votes: number;
}

export default function VotingScreen({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);

  const { data: players = [], refetch } = useQuery<Player[]>(["players", gameId], async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      { id: 1, name: "Alice", votes: 0 },
      { id: 2, name: "Bob", votes: 0 },
      { id: 3, name: "Charlie", votes: 0 },
      { id: 4, name: "David", votes: 0 },
    ];
  });

  const voteMutation = useMutation(
    async (playerId: number) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return playerId;
    },
    {
      onSuccess: () => {
        refetch();
      },
    },
  );

  const handleVote = () => {
    if (selectedPlayer !== null) {
      voteMutation.mutate(selectedPlayer);
    }
  };

  return (
    <Card className="w-full max-w-[500px]">
      <CardHeader>
        <CardTitle>Vote for the Mafia</CardTitle>
      </CardHeader>
      <CardContent>
        {!voteMutation.isSuccess ? (
          <RadioGroup onValueChange={value => setSelectedPlayer(Number(value))}>
            {players.map(player => (
              <div key={player.id} className="flex items-center space-x-2">
                <RadioGroupItem value={player.id.toString()} id={`player-${player.id}`} />
                <Label htmlFor={`player-${player.id}`}>{player.name}</Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div className="space-y-2">
            {players.map(player => (
              <div key={player.id} className="flex justify-between">
                <span>{player.name}</span>
                <span>{player.votes} votes</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!voteMutation.isSuccess ? (
          <Button className="w-full" onClick={handleVote} disabled={selectedPlayer === null || voteMutation.isLoading}>
            {voteMutation.isLoading ? "Submitting Vote..." : "Submit Vote"}
          </Button>
        ) : (
          <p className="text-center w-full">Voting has ended. Waiting for results...</p>
        )}
      </CardFooter>
    </Card>
  );
}
