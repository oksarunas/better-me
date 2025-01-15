import React, { useState, useEffect } from "react";
import HabitList from "./HabitList";
import HabitHeader from "./HabitHeader";
import HabitChart from "./HabitChart";
import HabitProgressBar from "./HabitProgressBar";
import { fetchHabitsApi, updateHabitApi, fetchWeeklyHabitsApi } from "../../api";
import { toast } from "react-toastify";
import "../../styles/HabitTracker.css";
import { WeeklyData, Habit } from "../../types"; // Ensure you're using the same type



const HabitTracker: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  ); // Default to today

  // Fetch daily habits
  useEffect(() => {
    const fetchHabits = async () => {
      setDailyLoading(true);
      try {
        const data: Habit[] = await fetchHabitsApi(selectedDate);
        setHabits(data);
        toast.success("Habits loaded successfully!");
      } catch (err) {
        console.error("Failed to fetch habits:", err);
        toast.error("Unable to load habits. Please try again later.");
      } finally {
        setDailyLoading(false);
      }
    };

    fetchHabits();
  }, [selectedDate]);

  // Fetch weekly data
  useEffect(() => {
    const fetchWeeklyData = async () => {
      setWeeklyLoading(true);
      try {
        const data: WeeklyData[] = await fetchWeeklyHabitsApi();
        setWeeklyData(data);
      } catch (err) {
        console.error("Failed to fetch weekly data:", err);
        toast.error("Unable to load weekly data. Please try again later.");
      } finally {
        setWeeklyLoading(false);
      }
    };

    fetchWeeklyData();
  }, []);

  // Handle habit toggling
  const onToggleHabit = async (habitId: number, newStatus: boolean) => {
    if (habitId <= 0) {
      console.error("Invalid habit ID:", habitId);
      toast.error("Invalid habit. Please refresh the page.");
      return;
    }

    try {
      setHabits((prevHabits) =>
        prevHabits.map((habit) =>
          habit.id === habitId ? { ...habit, status: newStatus } : habit
        )
      );
      await updateHabitApi(habitId, { status: newStatus });
      toast.success("Habit status updated successfully!");
    } catch (err) {
      console.error("Error updating habit:", err);
      toast.error("Failed to update habit. Please try again.");
      setHabits((prevHabits) =>
        prevHabits.map((habit) =>
          habit.id === habitId ? { ...habit, status: !newStatus } : habit
        )
      );
    }
  };

  const completedHabits = habits.filter((habit) => habit.status).length;
  const totalHabits = habits.length;

  if (dailyLoading || weeklyLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <HabitHeader
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
      <HabitProgressBar
        completedHabits={completedHabits}
        totalHabits={totalHabits}
      />
      <HabitChart weeklyData={weeklyData} />
      <HabitList habits={habits} onToggleHabit={onToggleHabit} />
    </div>
  );
};

export default HabitTracker;
