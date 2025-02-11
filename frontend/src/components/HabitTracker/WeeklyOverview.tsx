"use client";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { format, parseISO } from "date-fns";
import { WeeklyData } from "../../types";
import { useMemo } from "react";

interface WeeklyOverviewProps {
  weeklyData: WeeklyData[];
  todayDate: string;
  isLoading?: boolean;
}

const HabitBarChart = ({ data, className = "" }: { data: WeeklyData[]; className?: string }) => {
  return (
    <div className={`h-32 flex items-end gap-2 ${className}`}>
      {data.map((day, i) => {
        const percentage = useMemo(() => 
          day.total > 0 ? (day.completed / day.total) * 100 : 0,
        [day.completed, day.total]);
        
        return (
          <div
            key={i}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${format(parseISO(day.date), 'EEEE')} completion ${Math.round(percentage)}%`}
            className="flex-1 rounded-t relative group cursor-pointer transform transition-all duration-300 ease-out"
            style={{
              height: `${percentage}%`,
              backgroundColor: `hsla(${Math.min(percentage * 1.2, 120)}, 70%, 45%, 0.2)`,
            }}
          >
            <div 
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200"
              role="tooltip"
            >
              <Badge variant="outline">{Math.round(percentage)}%</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DayCard = ({ data, isToday }: { data: WeeklyData; isToday: boolean }) => {
  const percentage = useMemo(() => 
    data.total > 0 ? (data.completed / data.total) * 100 : 0,
  [data.completed, data.total]);

  return (
    <div
      className={`flex flex-col items-center p-2 rounded w-12 transition-colors duration-200
        ${isToday ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-700"}
      `}
      role="article"
      aria-label={`${format(parseISO(data.date), 'EEEE')} ${Math.round(percentage)}% completed`}
    >
      <span className="text-sm font-semibold">{format(parseISO(data.date), "EEE")}</span>
      <span className="text-xs">{format(parseISO(data.date), "d")}</span>
      <Badge variant="outline" className="mt-1">
        {Math.round(percentage)}%
      </Badge>
    </div>
  );
};

export default function WeeklyOverview({ weeklyData, todayDate, isLoading = false }: WeeklyOverviewProps) {
  if (isLoading) {
    return (
      <Card className="p-6 bg-gray-900/30 border-gray-800 animate-pulse">
        <div className="h-32 bg-gray-800 rounded mb-4" />
        <div className="h-24 bg-gray-800 rounded" />
      </Card>
    );
  }

  if (!weeklyData?.length) {
    return (
      <Card className="p-6 bg-gray-900/30 border-gray-800">
        <p className="text-center text-gray-400">No data available for this week</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-900/30 border-gray-800">
      <h3 className="text-lg font-medium mb-4">Weekly Habit Completion Progress</h3>
      <HabitBarChart data={weeklyData} />
      <h4 className="mt-6 mb-2 text-md font-semibold">Week at a Glance</h4>
      <div className="flex justify-between gap-2 overflow-x-auto">
        {weeklyData.map((data) => (
          <DayCard
            key={data.date}
            data={data}
            isToday={data.date === todayDate}
          />
        ))}
      </div>
    </Card>
  );
}
