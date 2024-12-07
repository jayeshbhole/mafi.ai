import { memo } from "react";
import { Player } from "../../stores/gameStore";
import PlayerList from "./PlayerList";
import TimerProgress from "./TimerProgress";
import { Card, CardTitle } from "@/components/ui/card";
import { Moon, Users } from "lucide-react";

interface OverlayCardProps {
  type: "voting" | "night";
  timeLeft: number;
  duration: number;
  players: Player[];
  nightMessage?: string;
  onVote?: (playerName: string) => void;
}

const OverlayCard = memo(({ type, timeLeft, duration, players, nightMessage, onVote }: OverlayCardProps) => {
  const isNight = type === "night";
  const gradientClass = isNight
    ? "bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900"
    : "bg-gradient-to-br from-rose-900 via-red-900 to-rose-900";

  const progressClass = isNight
    ? "bg-gradient-to-b from-indigo-600/20 to-indigo-900/5"
    : "bg-gradient-to-b from-rose-600/20 to-rose-900/5";

  return (
    <div className="absolute inset-0 z-10 animate-in fade-in zoom-in duration-300">
      <Card
        className={`w-full h-full flex flex-col items-center justify-center text-white relative overflow-hidden ${gradientClass}`}
      >
        <TimerProgress timeLeft={timeLeft} duration={duration} variant="vertical" className={progressClass} />

        <div className="relative z-10">
          {isNight ? (
            <>
              <Moon className="w-24 h-24 mb-8 text-indigo-300 animate-pulse" />
              <CardTitle className="text-2xl mb-4 text-center">Night Falls</CardTitle>
              <p className="text-lg text-center px-6 text-indigo-200 animate-in slide-in-from-bottom duration-500">
                {nightMessage}
              </p>
            </>
          ) : (
            <>
              <Users className="w-24 h-24 mb-8 text-red-300 animate-pulse" />
              <CardTitle className="text-2xl mb-4 text-center">Time to Vote</CardTitle>
              <PlayerList players={players} onVote={onVote} variant="voting" />
            </>
          )}
        </div>

        <div className="absolute top-6 right-6 text-white/80 font-medium">{timeLeft}s</div>
      </Card>
    </div>
  );
});

OverlayCard.displayName = "OverlayCard";

export default OverlayCard;
