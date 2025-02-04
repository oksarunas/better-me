"use client";

import { useEffect, useState } from "react";
import { Calendar, Flame } from "lucide-react";
import { Progress } from "../../components/ui/Progress";
import { Card } from "../../components/ui/Card";
import Checkbox from "../../components/ui/Checkbox";
import Badge from "../../components/ui/Badge";
import { Habit, WeeklyData } from "../../types";
import {
  fetchHabitsApi,
  fetchWeeklyHabitsApi,
  updateHabitApi,
} from "../../api";
import { format, parseISO } from "date-fns";

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The selected date
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Offset the current date by +1 / -1 days
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

        // Fetch habits for the selected date
        const [habitsData, weeklyDataResponse] = await Promise.all([
          fetchHabitsApi(selectedDate),
          fetchWeeklyHabitsApi(),
        ]);
        setHabits(habitsData);
        setWeeklyData(weeklyDataResponse);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  // Toggle habit completion status
  const toggleHabit = async (id: number, currentStatus: boolean) => {
    // 1. Optimistic update
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

    // 2. Make the API call
    try {
      await updateHabitApi(id, { status: !currentStatus });
    } catch (err: any) {
      // 3. Revert if the API call fails
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Title & Habit Summary */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">My Habits</h1>
            <p className="text-gray-400">
              {completedHabits} of {totalHabits} Habits Completed
            </p>
          </div>

          {/* The only place to display & change the date now */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleDateChange(-1)}
              className="btn text-sm text-gray-400 px-2 py-1 border border-gray-500 rounded"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              {new Date(selectedDate).toLocaleDateString()}
            </span>
            <button
              onClick={() => handleDateChange(1)}
              className="btn text-sm text-gray-400 px-2 py-1 border border-gray-500 rounded"
            >
              Next
            </button>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Habit List */}
        <div className="grid gap-4 md:grid-cols-2">
          {habits.map((habit) => (
            <Card
              key={habit.id}
              className={`p-4 transition-all hover:shadow-lg ${
                habit.status
                  ? "bg-gray-900/50 border-gray-800"
                  : "bg-gray-900/30 border-gray-800"
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
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={habit.status ? "default" : "secondary"}
                    className="transition-all"
                  >
                    <Flame className="h-4 w-4 mr-1 text-amber-500" />
                    {habit.streak} days
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Weekly Data Visualization */}
        <Card className="p-6 bg-gray-900/30 border-gray-800">
          <h3 className="text-lg font-medium mb-4">
            Weekly Habit Completion Progress
          </h3>
          <div className="h-32 flex items-end gap-2">
            {weeklyData.map((data, i) => {
              const percentage =
                data.total > 0 ? (data.completed / data.total) * 100 : 0;
              return (
                <div
                  key={i}
                  className="flex-1 bg-green-500/20 rounded-t relative group hover:bg-green-500/30 transition-all cursor-pointer"
                  style={{ height: `${percentage}%` }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="outline">{Math.round(percentage)}%</Badge>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            {weeklyData.map((data) => (
              <span key={data.date}>{format(parseISO(data.date), "EEE")}</span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
