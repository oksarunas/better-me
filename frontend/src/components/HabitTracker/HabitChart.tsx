import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { WeeklyData } from "../../types"; // Same type here


// Register required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);


interface AggregatedData {
  date: string;
  completionPercentage: number;
}

interface HabitChartProps {
  weeklyData: WeeklyData[];
}

const HabitChart: React.FC<HabitChartProps> = ({ weeklyData }) => {
  console.log("Weekly Data:", weeklyData);

  // Aggregate data to calculate completion percentages
  const aggregateWeeklyData = (): AggregatedData[] => {
    const groupedData = weeklyData.reduce<Record<string, { total: number; completed: number }>>(
      (acc, item) => {
        if (!acc[item.date]) {
          acc[item.date] = { total: 0, completed: 0 };
        }
        acc[item.date].total += 1;
        if (item.status) {
          acc[item.date].completed += 1;
        }
        return acc;
      },
      {}
    );

    return Object.keys(groupedData).map((date) => ({
      date,
      completionPercentage: Math.round(
        (groupedData[date].completed / groupedData[date].total) * 100
      ),
    }));
  };

  const aggregatedData = aggregateWeeklyData();

  const chartData = {
    labels: aggregatedData.map((day) => day.date),
    datasets: [
      {
        label: "Completion Percentage",
        data: aggregatedData.map((day) => day.completionPercentage || 0),
        backgroundColor: "rgba(76, 175, 80, 0.6)",
        borderColor: "#4caf50",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Weekly Habit Completion Progress",
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45, // Rotate labels
          minRotation: 45,
          autoSkip: true, // Show fewer labels
          maxTicksLimit: 4, // Limit number of labels
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
    <div className="mt-6" style={{ maxWidth: "800px", margin: "0 auto" }}>
      {weeklyData.length > 0 ? (
        <Bar data={chartData} options={chartOptions} />
      ) : (
        <p className="text-center text-gray-500">No weekly data available.</p>
      )}
    </div>
  );
};

export default HabitChart;
