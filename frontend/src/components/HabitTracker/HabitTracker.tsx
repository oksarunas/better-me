"use client";
import React from "react";
import { fetchHabitsApi, updateHabitApi, fetchWeeklyHabitsApi, fetchAnalyticsApi } from "../../api";
import { Habit, WeeklyData, AnalyticsData } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { Header } from "./Header";
import HabitList from "./HabitList";
import WeeklyOverview from "./WeeklyOverview";
import AnalyticsSection from "./Analytics";
import { motion } from "framer-motion";

export default function HabitTracker() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [backendHabits, setBackendHabits] = React.useState<Habit[]>([]);
  const [weeklyData, setWeeklyData] = React.useState<WeeklyData[]>([]);
  const [analyticsData, setAnalyticsData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<string>("all");
  const [sort, setSort] = React.useState<string>("name");
  const [search, setSearch] = React.useState<string>("");

  const todayDate = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [habitsData, weeklyDataResponse, analyticsDataResponse] = await Promise.all([
        fetchHabitsApi(selectedDate),
        fetchWeeklyHabitsApi(),
        fetchAnalyticsApi(30),
      ]);
      setBackendHabits(habitsData);
      setWeeklyData(weeklyDataResponse);
      setAnalyticsData(analyticsDataResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (user) fetchData();
  }, [selectedDate, user]);

  const handleToggleHabit = async (habitId: number, newStatus: boolean) => {
    try {
      const response = await updateHabitApi(habitId, { status: newStatus });
      setBackendHabits((habits) =>
        habits.map((h) =>
          h.id === habitId ? { ...h, status: newStatus, streak: response.streak } : h
        )
      );
      const [weeklyDataResponse, analyticsDataResponse] = await Promise.all([
        fetchWeeklyHabitsApi(),
        fetchAnalyticsApi(30),
      ]);
      setWeeklyData(weeklyDataResponse);
      setAnalyticsData(analyticsDataResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update habit.");
    }
  };

  const handleDateChange = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const filteredHabits = React.useMemo(() => {
    let result = [...backendHabits];
    if (filter !== "all") {
      result = result.filter((h) => (h.category || "Uncategorized").toLowerCase() === filter.toLowerCase());
    }
    if (search) {
      result = result.filter((h) => h.habit.toLowerCase().includes(search.toLowerCase()));
    }
    switch (sort) {
      case "name":
        result.sort((a, b) => a.habit.localeCompare(b.habit));
        break;
      case "streak":
        result.sort((a, b) => b.streak - a.streak);
        break;
      case "category":
        result.sort((a, b) => (a.category || "Uncategorized").localeCompare(b.category || "Uncategorized"));
        break;
      case "completion":
        result.sort((a, b) => (analyticsData?.completionRates[b.habit] || 0) - (analyticsData?.completionRates[a.habit] || 0));
        break;
    }
    return result;
  }, [backendHabits, filter, sort, search, analyticsData]);

  const groupedHabits = React.useMemo(() => {
    return filteredHabits.reduce((acc, habit) => {
      const category = habit.category || "Uncategorized";
      acc[category] = acc[category] || [];
      acc[category].push(habit);
      return acc;
    }, {} as Record<string, Habit[]>);
  }, [filteredHabits]);

  const completedHabits = filteredHabits.filter((h) => h.status).length;
  const totalHabits = filteredHabits.length;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 sm:p-6 text-gray-100">
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-indigo-500"
          />
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-400 p-4 text-center bg-red-900/20 rounded-lg mx-4 sm:mx-auto sm:max-w-md"
        >
          {error}
          <button
            onClick={fetchData}
            className="ml-4 text-indigo-400 underline hover:text-indigo-300 transition-colors"
          >
            Retry
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Header
              selectedDate={selectedDate}
              todayDate={todayDate}
              setSelectedDate={setSelectedDate}
              handleDateChange={handleDateChange}
              completedHabits={completedHabits}
              totalHabits={totalHabits}
              onFilterChange={setFilter}
              onSortChange={setSort}
              onSearch={setSearch}
            />
          </motion.div>
          <div className="grid gap-4 mt-4 sm:gap-6 sm:mt-6 max-w-full">
            {totalHabits === 0 ? (
              <motion.div
                variants={itemVariants}
                className="text-center p-4 sm:p-6 bg-gray-800/50 rounded-lg border border-gray-700 mx-4 sm:mx-0"
              >
                <h3 className="text-base sm:text-lg font-medium text-gray-300">No Habits Found</h3>
                <p className="text-gray-400 mt-2 text-sm sm:text-base">
                  {search ? "No habits match your search." : filter !== "all" ? "No habits in this category." : "Add some habits to get started!"}
                </p>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="w-full max-w-full">
                <HabitList groupedHabits={groupedHabits} toggleHabit={handleToggleHabit} />
              </motion.div>
            )}
            {weeklyData.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="text-center p-4 sm:p-6 bg-gray-800/50 rounded-lg border border-gray-700 mx-4 sm:mx-0"
              >
                <h3 className="text-base sm:text-lg font-medium text-gray-300">No Weekly Data</h3>
                <p className="text-gray-400 mt-2 text-sm sm:text-base">Complete some habits to see your weekly progress!</p>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="w-full max-w-full">
                <WeeklyOverview weeklyData={weeklyData} todayDate={todayDate} />
              </motion.div>
            )}
            {!analyticsData || Object.keys(analyticsData.completionRates).length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="text-center p-4 sm:p-6 bg-gray-800/50 rounded-lg border border-gray-700 mx-4 sm:mx-0"
              >
                <h3 className="text-base sm:text-lg font-medium text-gray-300">No Analytics Yet</h3>
                <p className="text-gray-400 mt-2 text-sm sm:text-base">Track some habits to see your trends!</p>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="w-full max-w-full">
                <AnalyticsSection analyticsData={analyticsData} habits={backendHabits} />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}