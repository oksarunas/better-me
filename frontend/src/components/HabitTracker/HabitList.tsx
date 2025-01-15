import React, { useMemo } from "react";
import { Habit, HabitListProps } from "../../types";



const HabitList: React.FC<HabitListProps> = ({ habits, onToggleHabit }) => {
  // Memoize the rendering logic
  const renderedHabits = useMemo(() => {
    if (!habits || habits.length === 0) {
      return <p className="text-gray-500">No habits found!</p>;
    }

    // Render all habits
    return habits.map((habit) => (
      <div
        key={habit.id}
        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={habit.status || false}
            onChange={() => onToggleHabit(habit.id, !habit.status)}
            aria-label={`Mark habit '${habit.habit}' as ${
              habit.status ? "incomplete" : "complete"
            }`}
          />
          <span>{habit.habit}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm px-2 py-1 rounded ${
              habit.streak > 0
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
          >
            🔥 {habit.streak || 0} days
          </span>
          <span
            className={`text-sm font-medium ${
              habit.status
                ? "text-green-600 dark:text-green-400"
                : "text-gray-500"
            }`}
          >
            {habit.status ? "Completed" : "Pending"}
          </span>
        </div>
      </div>
    ));
  }, [habits, onToggleHabit]);

  return <div className="habit-list">{renderedHabits}</div>;
};

export default React.memo(HabitList);
