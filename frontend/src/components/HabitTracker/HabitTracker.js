import React, { useState, useEffect } from "react";
import HabitList from "./HabitList";
import HabitHeader from "./HabitHeader";
import HabitChart from "./HabitChart";
import HabitProgressBar from "./HabitProgressBar";
import { fetchHabitsApi, updateHabitApi } from "../../Api";
import { toast } from "react-toastify";

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]); // Default to today

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const data = await fetchHabitsApi(selectedDate);
        console.log(data);
        setHabits(data);
        toast.success("Habits loaded successfully!");
      } catch (err) {
        console.error("Failed to fetch habits:", err);
        toast.error("Unable to load habits. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, [selectedDate]); // Re-fetch habits when the selected date changes

  const onToggleHabit = async (habitId, newStatus) => {
    if (habitId <= 0) {
      console.error("Invalid habit ID:", habitId);
      toast.error("Invalid habit. Please refresh the page.");
      return;
    }

    try {
      // Optimistic update
      setHabits((prevHabits) =>
        prevHabits.map((habit) =>
          habit.id === habitId ? { ...habit, status: newStatus } : habit
        )
      );

      // API call to update habit
      await updateHabitApi(habitId, { status: newStatus });
      toast.success("Habit status updated successfully!");
    } catch (err) {
      console.error("Error updating habit:", err);
      toast.error("Failed to update habit. Please try again.");

      // Rollback on error
      setHabits((prevHabits) =>
        prevHabits.map((habit) =>
          habit.id === habitId ? { ...habit, status: !newStatus } : habit
        )
      );
    }
  };

  // Calculate completed and total habits for the progress bar
  const completedHabits = habits.filter((habit) => habit.status).length;
  const totalHabits = habits.length;

  if (loading) {
    return <div>Loading habits...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with title and date selector */}
      <HabitHeader selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

      {/* Progress bar */}
      <HabitProgressBar completedHabits={completedHabits} totalHabits={totalHabits} />

      {/* Weekly chart */}
      <HabitChart weeklyData={habits} />

      {/* Habit list */}
      <HabitList habits={habits} onToggleHabit={onToggleHabit} />
    </div>
  );
}
