"use client";
import { Card } from "../../components/ui/Card";
import { Checkbox } from "../../components/ui/Checkbox";
import { Badge } from "../../components/ui/Badge";
import { Flame } from "lucide-react";
import { Habit } from "../../types";
import { Progress } from "../ui/Progress";
import { motion } from "framer-motion";

interface HabitListProps {
  groupedHabits: Record<string, Habit[]>;
  toggleHabit: (id: number, currentStatus: boolean) => void;
}

export default function HabitList({ groupedHabits, toggleHabit }: HabitListProps) {
  const STREAK_GOAL = 30;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-semibold mb-4">Daily Checklist</h2>
      {Object.entries(groupedHabits).map(([category, categoryHabits]) => (
        <div key={category} className="mb-8">
          <h3 className="text-lg font-bold mb-2">{category}</h3>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 w-full max-w-full">
            {categoryHabits.map((habit) => (
              <Card
                key={habit.id}
                className={`p-3 sm:p-4 transition-all hover:shadow-lg ${
                  habit.status ? "bg-gray-900/50 border-gray-800" : "bg-gray-900/30 border-gray-800"
                } hover:scale-101`}
              >
                <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap gap-y-2">
                  <Checkbox
                    checked={habit.status}
                    onChange={(e) => toggleHabit(habit.id, e.target.checked)}
                    className="h-5 w-5 transition-all data-[state=checked]:bg-green-500 hover:scale-105"
                    id={`habit-${habit.id}`}
                    aria-label={`Toggle ${habit.habit} status, currently ${habit.status ? "completed" : "incomplete"}`}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`habit-${habit.id}`}
                      className="font-medium cursor-pointer"
                    >
                      {habit.habit}
                    </label>
                    <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-2">
                      <Badge
                        variant={habit.status ? "primary" : "secondary"}
                        className="transition-all"
                      >
                        {habit.category || "Uncategorized"}
                      </Badge>
                      {habit.streak > 0 && (
                        <Badge
                          variant="success"
                          className="animate-pulse flex items-center gap-1"
                        >
                          <Flame className="h-4 w-4" />
                          {habit.streak} day streak
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 w-full">
                      <Progress
                        className="h-2"
                        value={(habit.streak / STREAK_GOAL) * 100}
                      />
                      <span className="text-xs text-gray-400 mt-1 block">
                        {habit.streak} / {STREAK_GOAL} day streak
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}