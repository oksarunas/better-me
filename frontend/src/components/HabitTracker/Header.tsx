"use client";
import { Calendar } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import DateSelector from "../DateSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { motion } from "framer-motion";

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

export function Header({

  selectedDate,
  todayDate,
  setSelectedDate,
  handleDateChange,
  completedHabits,
  totalHabits,
  onFilterChange,
  onSortChange,
  onSearch,
}: HeaderProps){
  return (
    <motion.header
    initial={{ opacity: 0, y: -20}}
    animate={{ opacity: 1, y: 0}}
    transition={{ duration: 0.3}}
    className= "flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Habits</h1>
          <p className="text-gray-400">
            {completedHabits} of {totalHabits} Habits Completed
            {selectedDate === todayDate && (
              <Badge variant="success" className="ml-2">Today</Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            defaultValue="all"
            onValueChange={onFilterChange}
            aria-label="Filter habits by category"
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Health">Health</SelectItem>
              <SelectItem value="Productivity">Productivity</SelectItem>
              <SelectItem value="Learning">Learning</SelectItem>
              <SelectItem value="Uncategorized">Uncategorized</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            defaultValue="name"
            onValueChange={onSortChange}
            aria-label="Sort habits"
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
            aria-label="Search habits"
          />
          <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
      </div>
      <DateSelector
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        handleDateChange={handleDateChange}
      />
    </motion.header>
  );
};