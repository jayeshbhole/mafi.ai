import { memo } from "react";

interface TimerProgressProps {
  timeLeft: number;
  duration: number;
  variant?: "horizontal" | "vertical";
  className?: string;
}

const TimerProgress = memo(({ timeLeft, duration, variant = "horizontal", className = "" }: TimerProgressProps) => {
  const percentage = (timeLeft / duration) * 100;

  if (variant === "vertical") {
    return (
      <div className="absolute right-0 top-0 h-full w-2">
        <div
          className={`w-full transition-all duration-1000 ease-linear ${className}`}
          style={{
            height: `${percentage}%`,
            transform: "scaleY(-1)", // Start from top
          }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden rounded-t-lg">
      <div
        className={`h-full transition-all duration-1000 ease-linear ${className}`}
        style={{
          width: `${percentage}%`,
        }}
      />
    </div>
  );
});

TimerProgress.displayName = "TimerProgress";

export default TimerProgress;
