"use client";
import { Card } from "../../components/ui/Card";
import { Bar, Line } from "react-chartjs-2";
import "chart.js/auto";

interface AnalyticsData {
  dates: string[];
  stackedData: {
    [category: string]: number[];
  };
  lineData: number[];
}

interface AnalyticsSectionProps {
  analyticsData: AnalyticsData;
}

export default function AnalyticsSection({ analyticsData }: AnalyticsSectionProps) {
  // Prepare data for the stacked bar chart
  const stackedBarData = {
    labels: analyticsData.dates,
    datasets: Object.entries(analyticsData.stackedData || {}).map(([category, data]) => {
      const categoryColors: Record<string, string> = {
        Health: "rgba(75,192,192,0.8)",
        Productivity: "rgba(153,102,255,0.8)",
        "Personal Growth": "rgba(255,159,64,0.8)",
        Uncategorized: "rgba(201,203,207,0.8)",
      };
      const backgroundColor = categoryColors[category] || "rgba(100,100,100,0.8)";
      return {
        label: category,
        data,
        backgroundColor,
      };
    }),
  };

  const stackedBarOptions = {
    plugins: {
      title: {
        display: true,
        text: "Habits Completed by Category",
      },
    },
    responsive: true,
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true },
    },
  };

  // Prepare data for the line chart
  const lineChartData = {
    labels: analyticsData.dates,
    datasets: [
      {
        label: "Overall Completion Trend (%)",
        data: analyticsData.lineData,
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        fill: true,
      },
    ],
  };

  const lineChartOptions = {
    plugins: {
      title: {
        display: true,
        text: "Overall Habit Completion Trend",
      },
    },
    responsive: true,
    scales: {
      y: { beginAtZero: true, max: 100 },
    },
  };

  return (
    <Card className="p-6 bg-gray-900/30 border-gray-800">
      <h3 className="text-lg font-medium mb-4">Richer Analytics</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Bar data={stackedBarData} options={stackedBarOptions} />
        </div>
        <div>
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>
    </Card>
  );
}
