import React, { useState, useEffect } from "react";
import { CalendarIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Progress } from "../ui/Progress";
import { cn } from "../../lib/Utils";
import Confetti from "react-confetti";
import { Tooltip as ReactTooltip } from "react-tooltip";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register the required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [weeklyData, setWeeklyData] = useState([]);

  // Fetch habits from backend
  useEffect(() => {
    const fetchHabits = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/progress/${selectedDate}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch habits");
        }
        const data = await response.json();
        setHabits(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, [selectedDate]);

  // Fetch weekly progress data
  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/progress/weekly`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch weekly progress data");
        }
        const data = await response.json();
        setWeeklyData(data); // Replace with real backend response
      } catch (error) {
        console.error("Error fetching weekly data:", error);
      }
    };

    fetchWeeklyData();
  }, []);

  // Compute total and completed habits
  const totalHabits = habits.length;
  const completedHabits = habits.filter((habit) => habit.status).length;
  const progress = (completedHabits / totalHabits) * 100;

  // Weekly progress chart data
  const chartData = {
    labels: weeklyData.map((day) => day.date), // Example: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    datasets: [
      {
        label: "Completion Percentage",
        data: weeklyData.map((day) => day.completionPercentage), // Example: [50, 60, 70, 80, 90, 100, 100]
        borderColor: "#4caf50",
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: true,
        text: "Weekly Habit Completion Progress",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Days of the Week",
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Completion Percentage",
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <Card className="max-w-4xl mx-auto">
        {completedHabits === totalHabits && <Confetti />}
        <CardHeader className="space-y-6">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">My Habits</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent focus:outline-none"
              />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {completedHabits} / {totalHabits} Habits Completed
              </span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!loading &&
            !error &&
            habits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span data-tip={habit.status ? "Completed" : "Pending"}>
                    {habit.status ? (
                      <CheckCircle2Icon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </span>
                  <ReactTooltip place="top" type="dark" effect="float" />
                  <span>{habit.habit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm px-2 py-1 rounded",
                      habit.streak > 0
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    )}
                  >
                    🔥 {habit.streak} days
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      habit.status
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500"
                    )}
                  >
                    {habit.status ? "Completed" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
      <div className="mt-6">
        {weeklyData.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <p className="text-center text-gray-500">No weekly data available.</p>
        )}
      </div>
    </div>
  );
}
