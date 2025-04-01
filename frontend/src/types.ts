import { IndexRouteObject, NonIndexRouteObject } from "react-router-dom";

// Extend the built-in IndexRouteObject to include our meta property
export interface CustomIndexRouteObject extends IndexRouteObject {
  meta?: {
    title: string;
  };
}

// Extend the built-in NonIndexRouteObject to include our meta property
export interface CustomNonIndexRouteObject extends NonIndexRouteObject {
  meta?: {
    title: string;
  };
  children?: CustomRouteObject[];
}

export type CustomRouteObject = CustomIndexRouteObject | CustomNonIndexRouteObject;

// User type (moved from AuthContext.tsx for reuse)
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
}

// Habit type (matches ProgressRead from schemas.py)
export interface Habit {
  id: number;
  habit: string;
  status: boolean;
  streak: number;
  category?: string; // Optional, nullable in backend
  date: string; // Added to match backend response
  user_id: number; // Added for completeness
}


// WeeklyData type (processed data for HabitTracker)
export interface WeeklyData {
  id: number;
  date: string;
  habit: string;
  status: boolean;
  streak: number;
  category?: string | null;
  completion_pct?: number | null;
}

export interface ChartData {
  name: string;
  progress: number;
}

export interface DailyAggregate {
  date: string;
  completed: number;
  total: number;
}

export interface DayData extends DailyAggregate {
  percentage: number;
}

// Analytics type (for /analytics/completion response)
export interface AnalyticsData {
  completionRates: Record<string, number>; // e.g., {"7 hours of sleep": 0.0, "Read for 20 minutes": 0.0}
  stackedData?: Record<string, number[]>;
  dates?: string[];
  lineData?: number[];
}

// Props interfaces
export interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (habitId: number, newStatus: boolean) => void;
}

export interface DateSelectorProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  handleDateChange: (offset: number) => void;
}