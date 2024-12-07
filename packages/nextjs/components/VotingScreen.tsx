"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useGameStore } from "@/stores/gameStore";
import { useMutation } from "@tanstack/react-query";

export default function VotingScreen({ gameId }: { gameId: string }) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>();

  const players = useGameStore(state => state.players);

  const round = useGameStore(state => state.round);

  const {
    mutate: vote,
    isSuccess: voteSuccess,
    isPending: votePending,
  } = useMutation({
    mutationKey: ["vote", round, gameId],
    mutationFn: async ({ playerId }: { playerId: string }) => {
      console.log("voting for", playerId);
    },
  });

  return (
    <Card className="w-full max-w-[500px]">
      <CardHeader>
        <CardTitle>Vote for the Mafia</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup onValueChange={value => (!selectedPlayer ? setSelectedPlayer(value) : null)}>
          {players.map(player => (
            <div key={player.id} className="flex items-center space-x-2">
              <RadioGroupItem
                disabled={Boolean(selectedPlayer && selectedPlayer !== player.id)}
                value={player.id}
                id={`player-${player.id}`}
              />
              <Label htmlFor={`player-${player.id}`}>{player.name}</Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        {!voteSuccess ? (
          <Button
            className="w-full"
            onClick={() => vote({ playerId: selectedPlayer?.toString() || "" })}
            disabled={selectedPlayer === null || voteSuccess}
          >
            {votePending ? "Submitting Vote..." : "Submit Vote"}
          </Button>
        ) : (
          <p className="text-center w-full">Voting has ended. Waiting for results...</p>
        )}
      </CardFooter>
    </Card>
  );
}
