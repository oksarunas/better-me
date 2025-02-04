import React from "react";
import { DateSelectorProps } from "../types";

const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  setSelectedDate,
  handleDateChange,
}) => {
  return (
    <section id="date-selector" className="my-4">
      <label htmlFor="progress-date" className="mr-2">
        Select Date:
      </label>
      <input
        type="date"
        id="progress-date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="p-2 border border-gray-400 rounded mr-4"
      />
      <button onClick={() => handleDateChange(-1)} className="btn mr-2">
        Previous
      </button>
      <button onClick={() => handleDateChange(1)} className="btn">
        Next
      </button>
    </section>
  );
};

export default DateSelector;
