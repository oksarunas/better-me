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
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }));
      const today = new Date().toISOString().split('T')[0];
      setIsToday(selectedDate === today);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [selectedDate]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div id="date-selector" className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 my-3 sm:my-4 w-full max-w-full">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <label htmlFor="progress-date" className="font-medium text-gray-300 text-sm sm:text-base">
          Date:
        </label>
        <input
          type="date"
          id="progress-date"
          value={selectedDate}
          onChange={handleInputChange}
          className={`p-1 sm:p-2 border border-gray-600 rounded bg-gray-800 text-white focus:outline-none focus:ring focus:border-blue-300 w-full sm:w-auto text-sm sm:text-base ${
            isToday ? 'ring-2 ring-green-500' : ''
          }`}
        />
        {isToday && (
          <span className="text-green-500 text-xs sm:text-sm">Today</span>
        )}
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="font-medium text-gray-300 text-sm sm:text-base">Time:</span>
        <span className="text-white bg-gray-800 px-2 py-1 rounded border border-gray-600 text-xs sm:text-sm">
          {currentTime}
        </span>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          onClick={() => handleDateChange(-1)}
          className="flex-1 sm:flex-none px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 transition duration-150 text-sm sm:text-base"
          aria-label="Previous date"
        >
          Previous
        </button>
        <button
          onClick={() => handleDateChange(1)}
          className="flex-1 sm:flex-none px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 transition duration-150 text-sm sm:text-base"
          aria-label="Next date"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DateSelector;