import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getAnalytics, AnalyticsData } from '../../api/analytics';
import { format, subDays } from 'date-fns';

const Analytics: React.FC = () => {
  // Auth context might be needed in the future
  useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const endDate = format(new Date(), 'yyyy-MM-dd');
        const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        
        const data = await getAnalytics(startDate, endDate);
        setAnalyticsData(data);
      } catch (err) {
        setError('Failed to fetch analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateStats = () => {
    if (!analyticsData) return { completionRate: 0, currentStreak: 0, totalHabits: 0 };

    const { lineData, stackedData } = analyticsData;
    
    const completionRate = lineData.length > 0 
      ? Math.round(lineData.reduce((a, b) => a + b, 0) / lineData.length)
      : 0;

    const currentStreak = lineData
      .reverse()
      .findIndex(rate => rate < 50);

    const totalHabits = Object.keys(stackedData).length;

    return { completionRate, currentStreak: currentStreak === -1 ? lineData.length : currentStreak, totalHabits };
  };

  const stats = calculateStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Habit Completion Rate Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Completion Rate</h2>
            <BarChart className="h-6 w-6 text-blue-500" />
          </div>
          <div className="text-4xl font-bold text-blue-500 mb-2">{stats.completionRate}%</div>
          <p className="text-gray-500">Average habit completion rate</p>
        </Card>

        {/* Current Streak Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Current Streak</h2>
            <Calendar className="h-6 w-6 text-green-500" />
          </div>
          <div className="text-4xl font-bold text-green-500 mb-2">{stats.currentStreak}</div>
          <p className="text-gray-500">Days in a row</p>
        </Card>

        {/* Total Habits Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Total Habits</h2>
            <LineChart className="h-6 w-6 text-purple-500" />
          </div>
          <div className="text-4xl font-bold text-purple-500 mb-2">{stats.totalHabits}</div>
          <p className="text-gray-500">Active habits being tracked</p>
        </Card>
      </div>

      {/* Progress Over Time Chart */}
      <Card className="mt-8 p-6">
        <h2 className="text-xl font-semibold mb-6">Progress Over Time</h2>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Loading chart data...</p>
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : analyticsData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analyticsData.dates.map((date, index) => ({
                  date,
                  completion: analyticsData.lineData[index]
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completion"
                  stroke="#3b82f6"
                  name="Daily Completion %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </Card>

      {/* Habit Breakdown */}
      <Card className="mt-8 p-6">
        <h2 className="text-xl font-semibold mb-6">Habit Breakdown</h2>
        <div className="space-y-4">
          {analyticsData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(analyticsData.stackedData).map(([habit, values]) => ({
                    habit,
                    completion: values.reduce((a, b) => a + b, 0) / values.length * 100
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="habit" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completion" fill="#3b82f6" name="Completion Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
