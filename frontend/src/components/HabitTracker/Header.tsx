import React, { FC } from "react";
import { Calendar } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import DateSelector from "../DateSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";

interface HeaderProps {
  selectedDate: string;
  todayDate: string;
  setSelectedDate: (date: string) => void;
  handleDateChange: (offset: number) => void;
  completedHabits: number;
  totalHabits: number;
  onFilterChange?: (value: string) => void;
  onSortChange?: (value: string) => void;
  onSearch?: (value: string) => void;
}

const Header: FC<HeaderProps> = ({
  selectedDate,
  todayDate,
  setSelectedDate,
  handleDateChange,
  completedHabits,
  totalHabits,
  onFilterChange,
  onSortChange,
  onSearch,
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
        <div className="flex items-center gap-4">
          <Select
            defaultValue="all"
            onValueChange={(value: string) => onFilterChange?.(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="productivity">Productivity</SelectItem>
              <SelectItem value="learning">Learning</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            defaultValue="name"
            onValueChange={(value: string) => onSortChange?.(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="streak">Streak</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="completion">Completion Rate</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="search"
            placeholder="Search habits..."
            className="w-[200px]"
            onChange={(e) => onSearch?.(e.target.value)}
          />
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
