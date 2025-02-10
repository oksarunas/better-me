import React, { FC } from "react";
import { Calendar } from "lucide-react";
import Badge from "../../components/ui/Badge";
import DateSelector from "../DateSelector";

interface HeaderProps {
  selectedDate: string;
  todayDate: string;
  setSelectedDate: (date: string) => void;
  handleDateChange: (offset: number) => void;
  completedHabits: number;
  totalHabits: number;
}

const Header: FC<HeaderProps> = ({
  selectedDate,
  todayDate,
  setSelectedDate,
  handleDateChange,
  completedHabits,
  totalHabits,
}) => {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Habits</h1>
          <p className="text-gray-400">
            {completedHabits} of {totalHabits} Habits Completed
          </p>
        </div>
        <Calendar className="h-5 w-5 text-gray-400" />
      </div>
      <DateSelector
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        handleDateChange={handleDateChange}
      />
    </header>
  );
};

export default Header;
