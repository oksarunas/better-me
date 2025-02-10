import React, { FC, ChangeEvent } from "react";
import { DateSelectorProps } from "../types";

const DateSelector: FC<DateSelectorProps> = ({
  selectedDate,
  setSelectedDate,
  handleDateChange,
}) => {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div id="date-selector" className="flex items-center gap-3 my-4">
      <label htmlFor="progress-date" className="font-medium text-gray-300">
        Date:
      </label>
      <input
        type="date"
        id="progress-date"
        value={selectedDate}
        onChange={handleInputChange}
        className="p-2 border border-gray-600 rounded bg-gray-800 text-white focus:outline-none focus:ring focus:border-blue-300"
      />
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
  );
};

export default DateSelector;
