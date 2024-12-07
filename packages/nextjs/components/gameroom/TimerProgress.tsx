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
      <div
        className={`w-full absolute right-0 bottom-0 h-full transition-all duration-1000 ease-linear ${className}`}
        style={{
          height: `${percentage}%`,
          transform: "scaleY(-1)", // Start from top
        }}
      />
    );
  }

  return (
    <div
      className={`h-full transition-all duration-1000 absolute inset-0 overflow-hidden rounded-r-lg ease-linear ${className}`}
      style={{
        width: `${percentage}%`,
      }}
    />
  );
});

TimerProgress.displayName = "TimerProgress";

export default TimerProgress;
