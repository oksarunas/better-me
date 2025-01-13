import React from "react";
import { Progress } from "../ui/Progress";

export default function HabitProgressBar({ completedHabits, totalHabits }) {
  const progress = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>
          {completedHabits} / {totalHabits} Habits Completed
        </span>
        <span>{progress.toFixed(0)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
