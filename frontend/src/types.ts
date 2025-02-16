// types.ts
import { IndexRouteObject, NonIndexRouteObject } from "react-router-dom";

// Extend the built-in IndexRouteObject to include our meta property
export interface CustomIndexRouteObject extends IndexRouteObject {
  meta?: {
    title: string;
  };
}

// Extend the built-in NonIndexRouteObject to include our meta property
// Also, update the children property to be an array of our custom route objects
export interface CustomNonIndexRouteObject extends NonIndexRouteObject {
  meta?: {
    title: string;
  };
  children?: CustomRouteObject[];
}

// Create a union type for our custom route objects
export type CustomRouteObject = CustomIndexRouteObject | CustomNonIndexRouteObject;

// (Other types remain unchanged...)
export interface WeeklyData {
  date: string;
  completed: number;
  total: number;
  status?: boolean;
}

export interface Habit {
  id: number;
  habit: string;
  status: boolean;
  streak: number;
  category?: string;
  goal: number;
}

export interface RawHabit {
  date: string;
  status: boolean;
}

export interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (habitId: number, newStatus: boolean) => void;
}

export interface DateSelectorProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  handleDateChange: (offset: number) => void;
}
