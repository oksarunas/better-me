"use client";
import { useEffect, useState } from "react";
import { Progress } from "../../components/ui/Progress";
import Header from "./Header";
import HabitList from "./HabitList";
import WeeklyOverview from "./WeeklyOverview";
import AnalyticsSection from "./Analytics"; // Updated import to match new file name
import {
  fetchHabitsApi,
  fetchWeeklyHabitsApi,
  fetchAnalyticsApi,
  updateHabitApi,
} from "../../api";
import { Habit, WeeklyData } from "../../types";

interface AnalyticsData {
  dates: string[];
  stackedData: { [category: string]: number[] };
  lineData: number[];
}

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Today's date in YYYY-MM-DD format
  const todayDate = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);

  const handleDateChange = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [habitsData, weeklyDataResponse, analyticsDataResponse] = await Promise.all([
          fetchHabitsApi(selectedDate),
          fetchWeeklyHabitsApi(),
          fetchAnalyticsApi(selectedDate, selectedDate),
        ]);
        setHabits(habitsData);
        setWeeklyData(weeklyDataResponse);
        setAnalyticsData(analyticsDataResponse);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  // Toggle habit completion status (with optimistic UI update)
  const toggleHabit = async (id: number, currentStatus: boolean) => {
    const updatedHabits = habits.map((habit) =>
      habit.id === id
        ? {
            ...habit,
            status: !currentStatus,
            streak: currentStatus ? habit.streak - 1 : habit.streak + 1,
          }
        : habit
    );
    setHabits(updatedHabits);

    try {
      await updateHabitApi(id, { status: !currentStatus });
    } catch (err: any) {
      const revertedHabits = updatedHabits.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              status: currentStatus,
              streak: currentStatus ? habit.streak + 1 : habit.streak - 1,
            }
          : habit
      );
      setHabits(revertedHabits);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  const completedHabits = habits.filter((habit) => habit.status).length;
  const totalHabits = habits.length;
  const progress = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

  // Group habits by category
  const groupedHabits = habits.reduce((groups: Record<string, Habit[]>, habit) => {
    const category = habit.category || "Uncategorized";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(habit);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <Header
          selectedDate={selectedDate}
          todayDate={todayDate}
          setSelectedDate={setSelectedDate} // Pass setSelectedDate so DateSelector can update it
          handleDateChange={handleDateChange}
          completedHabits={completedHabits}
          totalHabits={totalHabits}
        />
        <Progress value={progress} className="h-2" />
        <HabitList groupedHabits={groupedHabits} toggleHabit={toggleHabit} />
        <WeeklyOverview weeklyData={weeklyData} todayDate={todayDate} />
        {analyticsData && <AnalyticsSection analyticsData={analyticsData} />}
      </div>
    </div>
  );
}
