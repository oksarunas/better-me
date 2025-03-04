"use client";
import { Card } from "../../components/ui/Card";
import { Checkbox } from "../../components/ui/Checkbox";
import { Badge } from "../../components/ui/Badge";
import { Flame } from "lucide-react";
import { Habit } from "../../types";
import { Progress } from '../ui/Progress';

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
                } transform hover:scale-102 hover:-translate-y-1`}
              >
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={habit.status}
                    onChange={(e) => toggleHabit(habit.id, e.target.checked)}
                    className="h-5 w-5 transition-all data-[state=checked]:bg-green-500 hover:scale-110"
                  />
                  <div className="flex-1">
                    <span className="font-medium">{habit.habit}</span>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge 
                        variant={habit.status ? "primary" : "secondary"} 
                        className="transition-all"
                      >
                        {habit.category}
                      </Badge>
                      {habit.streak > 0 && (
                        <Badge 
                          variant="success" 
                          className="animate-pulse"
                        >
                          🔥 {habit.streak} day streak
                        </Badge>
                      )}
                    </div>
                    <Progress
                      className={`mt-2`}
                      value={habit.streak}
                      max={30}
                      variant="glass"
                      indicatorVariant="rainbow"
                      animated={true}
                      showValue={true}
                      valueLabel="day streak"
                    />
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
