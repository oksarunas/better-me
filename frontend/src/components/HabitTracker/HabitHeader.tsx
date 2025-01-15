import React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "../ui/Button";

interface HabitHeaderProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const HabitHeader: React.FC<HabitHeaderProps> = ({
  selectedDate,
  setSelectedDate,
}) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">My Habits</h2>
      <Button variant="outline" size="sm" className="gap-2">
        <CalendarIcon className="h-4 w-4" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-transparent focus:outline-none"
        />
      </Button>
    </div>
  );
};

export default HabitHeader;
