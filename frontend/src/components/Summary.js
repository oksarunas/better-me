import React from "react";

const Summary = ({ completedCount, totalCount }) => {
  const completionPercentage = totalCount
    ? ((completedCount / totalCount) * 100).toFixed(0)
    : 0;

  return (
    <section id="summary">
      <h2>Today's Summary</h2>
      <p id="completed-count">Completed: {completedCount} / {totalCount}</p>
      <p id="completion-percentage">Completion: {completionPercentage}%</p>
    </section>
  );
};

export default Summary;
