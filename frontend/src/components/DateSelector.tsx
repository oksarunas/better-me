import React from "react";
import { DateSelectorProps } from "../types";


const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  setSelectedDate,
  handleDateChange,
}) => {
  return (
    <section id="date-selector">
      <label htmlFor="progress-date">Select Date:</label>
      <input
        type="date"
        id="progress-date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />
      <div id="date-navigation">
        <button onClick={() => handleDateChange(-1)} className="btn">
          Previous
        </button>
        <button onClick={() => handleDateChange(1)} className="btn">
          Next
        </button>
      </div>
    </section>
  );
};

export default DateSelector;
