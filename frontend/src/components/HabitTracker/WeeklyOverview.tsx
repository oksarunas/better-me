"use client";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { format, parseISO } from "date-fns";
import { WeeklyData, DailyAggregate } from "../../types";
import { useMemo } from "react";

interface WeeklyOverviewProps {
  weeklyData: WeeklyData[];
  todayDate: string;
  isLoading?: boolean;
}

interface DayData extends DailyAggregate {
  percentage: number;
}

const HabitBarChart = ({ data, className = "" }: { data: DayData[]; className?: string }) => {
  return (
    <div className={`h-24 sm:h-32 flex items-end gap-1 sm:gap-2 w-full max-w-full ${className}`}>
      {data.map((day, i) => (
        <div
          key={i}
          role="progressbar"
          aria-valuenow={day.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${format(parseISO(day.date), 'EEEE')} completion ${Math.round(day.percentage)}%`}
          className="flex-1 rounded-t relative group cursor-pointer transform transition-all duration-300 ease-out min-w-[20px]"
          style={{
            height: `${day.percentage}%`,
            backgroundColor: `hsla(${Math.min(day.percentage * 1.2, 120)}, 70%, 45%, 0.2)`,
          }}
        >
          <div 
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200"
            role="tooltip"
          >
            <Badge variant="outline">{Math.round(day.percentage)}%</Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

const DayCard = ({ data, isToday }: { data: DayData; isToday: boolean }) => {
  return (
    <div
      className={`flex flex-col items-center p-2 rounded w-10 sm:w-12 transition-colors duration-200
        ${isToday ? "bg-green-600 hover:bg-green-700" : "bg-gray-800 hover:bg-gray-700"}
      `}
      role="article"
      aria-label={`${format(parseISO(data.date), 'EEEE')} ${Math.round(data.percentage)}% completed`}
    >
      <span className="text-xs sm:text-sm font-semibold">{format(parseISO(data.date), "EEE")}</span>
      <span className="text-xs">{format(parseISO(data.date), "d")}</span>
      <Badge variant="outline" className="mt-1 text-xs">
        {Math.round(data.percentage)}%
      </Badge>
    </div>
  );
};

export default function WeeklyOverview({ weeklyData, todayDate, isLoading = false }: WeeklyOverviewProps) {
  const aggregatedData = useMemo(() => {
    if (!weeklyData.length) return [];

    const result = weeklyData.reduce((acc: DailyAggregate[], item: WeeklyData) => {
      const existingDay = acc.find(entry => entry.date === item.date);
      if (existingDay) {
        existingDay.completed += item.status ? 1 : 0;
        existingDay.total += 1;
      } else {
        acc.push({
          date: item.date,
          completed: item.status ? 1 : 0,
          total: 1
        });
      }
      return acc;
    }, []);

    return result
      .map(day => ({
        ...day,
        percentage: day.total > 0 ? (day.completed / day.total) * 100 : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date)) as DayData[];
  }, [weeklyData]);

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6 bg-gray-900/30 border-gray-800 animate-pulse">
        <div className="h-24 bg-gray-800 rounded mb-4" />
        <div className="h-24 bg-gray-800 rounded" />
      </Card>
    );
  }

  if (!aggregatedData.length) {
    return (
      <Card className="p-4 sm:p-6 bg-gray-900/30 border-gray-800">
        <p className="text-center text-gray-400">No data available for this week</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 bg-gray-900/30 border-gray-800">
      <h3 className="text-base sm:text-lg font-medium mb-4">Weekly Habit Completion Progress</h3>
      <HabitBarChart data={aggregatedData} />
      <h4 className="mt-6 mb-2 text-sm sm:text-base font-semibold">Week at a Glance</h4>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 sm:justify-between w-full max-w-full">
        {aggregatedData.map((data) => (
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