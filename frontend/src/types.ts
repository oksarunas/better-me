export interface WeeklyData {
  date: string;
  completed: number;
  total: number;
  status?: boolean; // Add this field if needed
}

export interface Habit {
  id: number;
  habit: string; // The name of the habit
  status: boolean;
  streak: number;
}

export interface RawHabit {
  date: string;   // Date in YYYY-MM-DD format
  status: boolean; // Whether the habit was completed
}


export interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (habitId: number, newStatus: boolean) => void;
}

export interface DateSelectorProps {
  selectedDate: string; // The currently selected date (in YYYY-MM-DD format)
  setSelectedDate: (date: string) => void; // Function to update the selected date
  handleDateChange: (offset: number) => void; // Function to handle date navigation
}