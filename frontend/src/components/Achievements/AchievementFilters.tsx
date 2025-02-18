import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { AchievementCategory, AchievementFilters } from './types';

interface AchievementFilterControlsProps {
  filters: AchievementFilters;
  onFilterChange: (filters: AchievementFilters) => void;
}

export const AchievementFilterControls: React.FC<AchievementFilterControlsProps> = ({
  filters,
  onFilterChange,
}) => {
  const categories: { value: AchievementCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'habits', label: '🎯 Habits' },
    { value: 'sleep', label: '😴 Sleep' },
    { value: 'fitness', label: '💪 Fitness' },
    { value: 'mindfulness', label: '🧘 Mindfulness' },
    { value: 'general', label: '⭐ General' },
  ];

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'locked', label: '🔒 Locked' },
    { value: 'unlocked', label: '🏆 Unlocked' },
  ];

  const sortOptions = [
    { value: 'progress', label: '📊 By Progress' },
    { value: 'recent', label: '🕒 Most Recent' },
    { value: 'alphabetical', label: '📝 Alphabetical' },
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <Select
        value={filters.category}
        onValueChange={(value) => onFilterChange({ ...filters, category: value as AchievementCategory | 'all' })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select Category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(value) => onFilterChange({ ...filters, status: value as 'all' | 'locked' | 'unlocked' })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select Status" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sortBy}
        onValueChange={(value) => onFilterChange({ ...filters, sortBy: value as 'progress' | 'recent' | 'alphabetical' })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
