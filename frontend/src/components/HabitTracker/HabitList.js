import React from "react";

export default function HabitList({ habits, onToggleHabit }) {
  return (
    <div className="habit-list">
      {habits.map((habit) => (
        <div
          key={habit.id}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={habit.status}
              onChange={() => onToggleHabit(habit.id, !habit.status)}
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
              🔥 {habit.streak} days
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
      ))}
    </div>
  );
}
