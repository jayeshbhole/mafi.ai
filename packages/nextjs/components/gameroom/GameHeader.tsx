import { memo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import PlayerList from "./PlayerList";
import TimerProgress from "./TimerProgress";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { PHASE_DURATION, useGameStore } from "@/services/store/gameStore";
import type { GamePhase } from "@mafia/types";
import { Moon, Skull, Sun, Users } from "lucide-react";

interface PhaseStyle {
  background: string;
  icon: JSX.Element | null;
  timerColor: string;
  headerBg: string;
}

const getPhaseStyles = (phase: GamePhase): PhaseStyle => {
  switch (phase) {
    case "DAY":
      return {
        background: "bg-background",
        icon: <Sun className="w-6 h-6" />,
        timerColor: "from-primary/20 to-primary/5",
        headerBg: "bg-card",
      };
    case "NIGHT":
      return {
        background: "bg-background",
        icon: <Moon className="w-6 h-6" />,
        timerColor: "from-secondary/20 to-secondary/5",
        headerBg: "bg-card",
      };
    case "VOTING":
      return {
        background: "bg-background",
        icon: <Users className="w-6 h-6" />,
        timerColor: "from-destructive/20 to-destructive/5",
        headerBg: "bg-card",
      };
    default:
      return {
        background: "bg-background",
        icon: null,
        timerColor: "from-primary/20 to-primary/5",
        headerBg: "bg-card",
      };
  }
};

const GameHeader = memo(() => {
  const roomId = useParams().roomId as string;

  const phase = useGameStore(state => state.phase);
  const phaseStyles = getPhaseStyles(phase);

  const players = useGameStore(state => state.players);
  const duration = PHASE_DURATION[phase];

  const timeLeft = useGameStore(state => state.timeLeft);

  return (
    <div className="relative">
      <TimerProgress timeLeft={timeLeft} duration={duration} className={`bg-gradient-to-r ${phaseStyles.timerColor}`} />

      <CardHeader className="space-y-2 relative z-10">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {phaseStyles.icon}
            <span>Game Room {roomId}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-normal">
            {phase === "NIGHT" && <Skull className="w-4 h-4" />}
            {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase: {timeLeft}s
          </div>
        </CardTitle>

        <PlayerList players={players} />
      </CardHeader>
    </div>
  );
});

GameHeader.displayName = "GameHeader";

export default GameHeader;
