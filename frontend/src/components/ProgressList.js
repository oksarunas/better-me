import React from "react";
import { apiFetch } from "../api";

const ProgressList = ({ habits, progressData, selectedDate, setProgressData, setCompletedCount }) => {
    const toggleHabit = async (habitName, status) => {
        try {
            const updatedHabit = await apiFetch("/progress/", {
                method: "POST",
                body: JSON.stringify({ date: selectedDate, habit: habitName, status }),
            });

            // Update the progress data
            const updatedData = progressData.map((habit) =>
                habit.habit === habitName ? { ...habit, ...updatedHabit } : habit
            );
            setProgressData(updatedData);

            // Recalculate completed count
            const completed = updatedData.filter((habit) => habit.status).length;
            setCompletedCount(completed);
        } catch (error) {
            console.error("Error updating habit:", error);
        }
    };

    return (
        <section id="progress-list">
            {habits.map((habitName) => {
                const habitData = progressData.find((h) => h.habit === habitName) || {};
                const isChecked = habitData.status || false;
                const streak = habitData.streak || 0;

                return (
                    <div key={habitName} className={`habit ${isChecked ? "completed" : ""}`}>
                        <div>
                            <span className="habit-name">{habitName}</span>
                            <div className="streak-progress">
                                <div
                                    className="streak-progress-fill"
                                    style={{ width: `${Math.min(streak * 10, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <div>
                            <span className="streak-badge">{streak}</span>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => toggleHabit(habitName, e.target.checked)}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                );
            })}
        </section>
    );
};

export default ProgressList;
