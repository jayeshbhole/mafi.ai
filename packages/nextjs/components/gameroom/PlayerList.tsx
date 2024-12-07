import { memo } from "react";
import { Player } from "../../stores/gameStore";

interface PlayerListProps {
  players: Player[];
  onVote?: (playerName: string) => void;
  variant?: "compact" | "voting";
}

const PlayerList = memo(({ players, onVote, variant = "compact" }: PlayerListProps) => {
  if (variant === "voting") {
    return (
      <div className="w-full max-w-sm space-y-4 p-6">
        {players
          .filter(p => p.isAlive)
          .map(player => (
            <button
              key={player.name}
              className="w-full h-12 bg-white/10 hover:bg-white/20 border border-white/20 text-white flex justify-between items-center group transition-all duration-200 rounded-lg px-4"
              onClick={() => onVote?.(player.name)}
            >
              <span className="font-medium">{player.name}</span>
              {player.votes ? (
                <span className="px-2 py-1 rounded-full bg-white/20 text-sm">{player.votes} votes</span>
              ) : (
                <span className="px-2 py-1 rounded-full bg-white/10 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Vote
                </span>
              )}
            </button>
          ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {players.map(player => (
        <span
          key={player.name}
          className={`px-2 py-1 rounded-full ${
            player.isAlive ? "bg-secondary" : "bg-destructive text-destructive-foreground"
          }`}
        >
          {player.name} {!player.isAlive && "☠️"}
          {player.votes ? ` (${player.votes})` : ""}
        </span>
      ))}
    </div>
  );
});

PlayerList.displayName = "PlayerList";

export default PlayerList;
