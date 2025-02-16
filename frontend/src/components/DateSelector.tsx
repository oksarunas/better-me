import React, { FC, ChangeEvent, useState, useEffect } from "react";
import { DateSelectorProps } from "../types";

const DateSelector: FC<DateSelectorProps> = ({
  selectedDate,
  setSelectedDate,
  handleDateChange,
}) => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isToday, setIsToday] = useState<boolean>(false);

  useEffect(() => {
    // Update time every minute
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }));
      
      // Check if selected date is today
      const today = new Date().toISOString().split('T')[0];
      setIsToday(selectedDate === today);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [selectedDate]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div id="date-selector" className="flex items-center gap-3 my-4">
      <div className="flex items-center gap-2">
        <label htmlFor="progress-date" className="font-medium text-gray-300">
          Date:
        </label>
        <input
          type="date"
          id="progress-date"
          value={selectedDate}
          onChange={handleInputChange}
          className={`p-2 border border-gray-600 rounded bg-gray-800 text-white focus:outline-none focus:ring focus:border-blue-300 ${
            isToday ? 'ring-2 ring-green-500' : ''
          }`}
        />
        {isToday && (
          <span className="text-green-500 text-sm">Today</span>
        )}
      </div>
      
      <div className="flex items-center gap-2 ml-4">
        <span className="font-medium text-gray-300">Time:</span>
        <span className="text-white bg-gray-800 px-2 py-1 rounded border border-gray-600">
          {currentTime}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={() => handleDateChange(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 transition duration-150"
          aria-label="Previous date"
        >
          Previous
        </button>
        <button
          onClick={() => handleDateChange(1)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 transition duration-150"
          aria-label="Next date"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DateSelector;
