import React, { useState, useEffect } from "react";
import HabitList from "./HabitList";

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);

  // Fetch habits from the backend
  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const response = await fetch("/api/progress/2025-01-13");
        const data = await response.json();
        setHabits(data);
      } catch (err) {
        console.error("Failed to fetch habits:", err);
      }
    };

    fetchHabits();
  }, []);

  const onToggleHabit = async (habitId, newStatus) => {
    try {
      // Update status in the backend
      const response = await fetch(`/api/progress/${habitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update habit");
      }

      // Update the status locally
      setHabits((prevHabits) =>
        prevHabits.map((habit) =>
          habit.id === habitId ? { ...habit, status: newStatus } : habit
        )
      );
    } catch (err) {
      console.error("Error updating habit:", err);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold">My Habits</h2>
      <HabitList habits={habits} onToggleHabit={onToggleHabit} />
    </div>
  );
}
