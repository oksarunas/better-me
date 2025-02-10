"use client";
import { Card } from "../../components/ui/Card";
import Checkbox from "../../components/ui/Checkbox";
import Badge from "../../components/ui/Badge";
import { Flame } from "lucide-react";
import { Habit } from "../../types";

interface HabitListProps {
  groupedHabits: Record<string, Habit[]>;
  toggleHabit: (id: number, currentStatus: boolean) => void;
}

export default function HabitList({ groupedHabits, toggleHabit }: HabitListProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Daily Checklist</h2>
      {Object.entries(groupedHabits).map(([category, categoryHabits]) => (
        <div key={category} className="mb-8">
          <h3 className="text-lg font-bold mb-2">{category}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {categoryHabits.map((habit) => (
              <Card
                key={habit.id}
                className={`p-4 transition-all hover:shadow-lg ${
                  habit.status ? "bg-gray-900/50 border-gray-800" : "bg-gray-900/30 border-gray-800"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={habit.status}
                    onCheckedChange={() => toggleHabit(habit.id, habit.status)}
                    className="h-5 w-5 transition-all data-[state=checked]:bg-green-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium">{habit.habit}</span>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={habit.status ? "default" : "secondary"} className="transition-all">
                        <Flame className="h-4 w-4 mr-1 text-amber-500" />
                        {habit.streak} days in a row!
                      </Badge>
                      {habit.streak >= 7 && (
                        <Badge variant="secondary" className="transition-all">
                          Level {Math.floor(habit.streak / 7)}
                        </Badge>
                      )}
                      {(() => {
                        const milestone =
                          habit.streak >= 100
                            ? "100+ Days Milestone!"
                            : habit.streak >= 30
                            ? "30+ Days Milestone!"
                            : habit.streak >= 7
                            ? "7+ Days Milestone!"
                            : null;
                        return milestone ? (
                          <Badge variant="success" className="transition-all">
                            {milestone}
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
