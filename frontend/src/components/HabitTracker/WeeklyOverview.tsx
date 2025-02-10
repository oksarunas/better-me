"use client";
import { Card } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { format, parseISO } from "date-fns";
import { WeeklyData } from "../../types";

interface WeeklyOverviewProps {
  weeklyData: WeeklyData[];
  todayDate: string;
}

export default function WeeklyOverview({ weeklyData, todayDate }: WeeklyOverviewProps) {
  return (
    <Card className="p-6 bg-gray-900/30 border-gray-800">
      <h3 className="text-lg font-medium mb-4">Weekly Habit Completion Progress</h3>
      <div className="h-32 flex items-end gap-2">
        {weeklyData.map((data, i) => {
          const percentage = data.total > 0 ? (data.completed / data.total) * 100 : 0;
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
      <h4 className="mt-6 mb-2 text-md font-semibold">Week at a Glance</h4>
      <div className="flex justify-between">
        {weeklyData.map((data) => {
          const percentage = data.total > 0 ? (data.completed / data.total) * 100 : 0;
          const isToday = data.date === todayDate;
          return (
            <div
              key={data.date}
              className={`flex flex-col items-center p-2 rounded w-12 ${isToday ? "bg-green-600" : "bg-gray-800"}`}
            >
              <span className="text-sm font-semibold">{format(parseISO(data.date), "EEE")}</span>
              <span className="text-xs">{format(parseISO(data.date), "d")}</span>
              <Badge variant="outline" className="mt-1">
                {Math.round(percentage)}%
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
