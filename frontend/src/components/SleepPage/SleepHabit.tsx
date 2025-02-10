"use client";
import React, { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

// Assume that SleepData is defined in your types file:
export interface SleepData {
  date: string;  // in YYYY-MM-DD format
  hours: number; // hours of sleep recorded
}

// Dummy API function to fetch sleep data; replace with your actual API call
async function fetchSleepData(): Promise<SleepData[]> {
  // This dummy data represents a week's worth of sleep records.
  return Promise.resolve([
    { date: "2025-02-04", hours: 7.5 },
    { date: "2025-02-05", hours: 6.8 },
    { date: "2025-02-06", hours: 8.2 },
    { date: "2025-02-07", hours: 7.0 },
    { date: "2025-02-08", hours: 6.5 },
    { date: "2025-02-09", hours: 8.0 },
    { date: "2025-02-10", hours: 7.2 },
  ]);
}

interface SleepAnalyticsData {
  dates: string[];
  sleepHours: number[];
  averageSleep: number;
}

const SleepHabitDetail: React.FC = () => {
  const [sleepData, setSleepData] = useState<SleepData[]>([]);
  const [analyticsData, setAnalyticsData] = useState<SleepAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchSleepData();
        setSleepData(data);

        // Process the data for analytics:
        const dates = data.map((d) => d.date);
        const sleepHours = data.map((d) => d.hours);
        const totalHours = sleepHours.reduce((acc, curr) => acc + curr, 0);
        const averageSleep = sleepHours.length ? totalHours / sleepHours.length : 0;
        setAnalyticsData({ dates, sleepHours, averageSleep });
      } catch (err: any) {
        setError(err.message || "Failed to fetch sleep data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-400">Loading sleep data...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  // Prepare chart data for the sleep trend:
  const chartData = analyticsData
    ? {
        labels: analyticsData.dates,
        datasets: [
          {
            label: "Sleep Hours",
            data: analyticsData.sleepHours,
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            fill: true,
          },
        ],
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <Card className="p-6 bg-gray-900/30 border-gray-800">
          <h1 className="text-2xl font-bold text-white">Sleep Habit Details</h1>
          {analyticsData && (
            <p className="mt-2 text-gray-300">
              Average Sleep: {analyticsData.averageSleep.toFixed(1)} hours
            </p>
          )}
        </Card>

        {/* Sleep Trend Chart */}
        {chartData && (
          <Card className="p-6 bg-gray-900/30 border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4">
              Sleep Trend Over Time
            </h2>
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: "Sleep Hours Over Time",
                    color: "white",
                  },
                  legend: {
                    labels: { color: "white" },
                  },
                },
                scales: {
                  x: {
                    ticks: { color: "white" },
                  },
                  y: {
                    beginAtZero: true,
                    ticks: { color: "white" },
                  },
                },
              }}
            />
          </Card>
        )}

        {/* Sleep Records List */}
        <Card className="p-6 bg-gray-900/30 border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">
            Sleep Records
          </h2>
          <ul className="text-gray-300">
            {sleepData.map((record) => (
              <li key={record.date} className="mb-1">
                <strong>{record.date}:</strong> {record.hours} hours
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default SleepHabitDetail;
