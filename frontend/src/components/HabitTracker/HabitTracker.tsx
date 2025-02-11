"use client";

import { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Calendar } from "../ui/Calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/Tabs";
import { BarChart, LineChart } from "lucide-react";
import {
  fetchHabitsApi,
  fetchWeeklyHabitsApi,
  fetchAnalyticsApi,
  updateHabitApi,
} from "../../api";
import { Habit, WeeklyData } from "../../types";
import { useAuth } from "../../contexts/AuthContext";

interface AnalyticsData {
  dates: string[];
  stackedData: { [habit: string]: number[] };
  lineData: number[];
}

export default function HabitTracker() {
  const { logout } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("habits");

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
          fetchAnalyticsApi(
            new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
            selectedDate
          ),
        ]);
        setHabits(habitsData);
        setWeeklyData(weeklyDataResponse);
        setAnalyticsData(analyticsDataResponse);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]);

  const handleToggleHabit = async (habitId: number, newStatus: boolean) => {
    try {
      await updateHabitApi(habitId, { status: newStatus });
      setHabits(habits.map(h => 
        h.id === habitId ? { ...h, status: newStatus } : h
      ));
    } catch (err) {
      console.error("Error updating habit:", err);
    }
  };

  // Group habits by category
  const habitsByCategory = habits.reduce((acc, habit) => {
    const category = habit.category || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(habit);
    return acc;
  }, {} as Record<string, Habit[]>);

  const completedCount = habits.filter(h => h.status).length;

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header with Sign Out */}
      <header className="flex items-center justify-between mb-8">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="habits">Habits</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" onClick={logout}>Sign Out</Button>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Checklist */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Daily Checklist</h2>
            <Badge variant="secondary">{completedCount} of {habits.length} Completed</Badge>
          </div>

          {/* Categories Section */}
          <div className="space-y-4">
            {Object.entries(habitsByCategory).map(([category, categoryHabits]) => (
              <div key={category}>
                <div className="font-semibold text-muted-foreground">{category}</div>
                <div className="grid gap-2">
                  {categoryHabits.map(habit => (
                    <div key={habit.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary">
                      <span>{habit.habit}</span>
                      <input
                        type="checkbox"
                        checked={habit.status}
                        onChange={(e) => handleToggleHabit(habit.id, e.target.checked)}
                        className="form-checkbox h-5 w-5"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Calendar and Analytics Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Monthly Overview</h2>
            <div className="flex gap-2">
              <Button size="icon" variant="outline">
                <BarChart className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline">
                <LineChart className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Calendar
            mode="single"
            selected={new Date(selectedDate)}
            onSelect={(date) => date && setSelectedDate(date.toISOString().split('T')[0])}
            className="rounded-md border"
          />

          {analyticsData && (
            <div className="grid gap-4 md:grid-cols-3 mt-6">
              <div className="space-y-2">
                <div className="text-lg font-medium">Current Streak</div>
                <div className="text-3xl font-bold">
                  {Math.max(...habits.map(h => h.streak))} Days
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-lg font-medium">Today's Progress</div>
                <div className="text-3xl font-bold">
                  {Math.round((completedCount / habits.length) * 100)}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-lg font-medium">30-Day Avg</div>
                <div className="text-3xl font-bold">
                  {analyticsData.lineData.length > 0 
                    ? Math.round(analyticsData.lineData.reduce((a, b) => a + b, 0) / analyticsData.lineData.length)
                    : 0}%
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
