import { memo } from "react";
import { PHASE_DURATION, Player, useGameStore } from "../../stores/gameStore";
import PlayerList from "./PlayerList";
import TimerProgress from "./TimerProgress";
import { Card, CardTitle } from "@/components/ui/card";
import { Moon, Skull, Users } from "lucide-react";

interface OverlayCardProps {
  onVote?: (playerName: string) => void;
}

const OverlayCard = memo(({ onVote }: OverlayCardProps) => {
  const phase = useGameStore(state => state.phase);
  const players = useGameStore(state => state.players);
  const nightMessage = useGameStore(state => state.nightMessage);
  const overlayCard = useGameStore(state => state.overlayCard);
  const killedPlayer = useGameStore(state => state.killedPlayer);

  const duration = PHASE_DURATION[phase];
  const timeLeft = useGameStore(state => state.timeLeft);

  if (overlayCard === "death") {
    return (
      <div className="absolute inset-0 z-10 animate-in fade-in zoom-in duration-1000">
        <Card className="w-full h-full flex flex-col items-center justify-center text-white relative overflow-hidden bg-gradient-to-br from-black via-red-950 to-black">
          <div className="absolute inset-0 bg-[url('/blood.png')] opacity-20 mix-blend-overlay" />

          <div className="relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom duration-1000">
            <Skull className="w-32 h-32 mb-8 text-red-500 animate-pulse" />
            <CardTitle className="text-4xl mb-6 text-center font-serif text-red-500">A Body Was Found</CardTitle>
            <p className="text-2xl text-center px-6 text-red-200 font-serif max-w-lg leading-relaxed">
              As dawn breaks, the villagers discover the lifeless body of{" "}
              <span className="text-red-400 font-semibold">{killedPlayer}</span>
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black to-transparent" />
        </Card>
      </div>
    );
  }

  const isNight = phase === "night";
  const gradientClass = isNight
    ? "bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900"
    : "bg-gradient-to-br from-rose-900 via-red-900 to-rose-900";

  const progressClass = "bg-black/25";

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
