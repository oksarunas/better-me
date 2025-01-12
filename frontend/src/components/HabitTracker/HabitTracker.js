import React, { useState, useEffect } from 'react';
import './HabitTracker.css';

const HabitTracker = () => {
  const [habits, setHabits] = useState([]); // Store fetched habits
  const [loading, setLoading] = useState(false); // Track loading state
  const [error, setError] = useState(null); // Track error state

  // Fetch habits on component mount
  useEffect(() => {
    const fetchHabits = async () => {
      setLoading(true);
      setError(null); // Reset error state before fetching

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/progress/${today}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setHabits(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, []);

  return (
    <div className="habit-tracker">
      <h2>My Habits</h2>

      {/* Loading State */}
      {loading && <p>Loading...</p>}

      {/* Error State */}
      {error && <p className="error-message">Error: {error}</p>}

      {/* Habits List */}
      {!loading && !error && habits.length > 0 ? (
        <ul>
          {habits.map((habit, index) => (
            <li key={index} className="habit-item">
              <strong>{habit.habit}</strong> - {habit.status ? 'Completed' : 'Pending'}
            </li>
          ))}
        </ul>
      ) : (
        !loading && !error && <p>No habits found.</p>
      )}
    </div>
  );
};

export default HabitTracker;
