import React, { useState, useEffect } from "react";
import { apiFetch } from "./api";
import Header from "./components/Header";
import DateSelector from "./components/DateSelector";
import ProgressList from "./components/ProgressList";
import Summary from "./components/Summary";
import "./styles/global.css";

const App = () => {
    const habits = [
        "7 hours of sleep",
        "Breakfast",
        "Workout",
        "Code",
        "Creatine",
        "Read",
        "Vitamins",
        "No drink",
    ];

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [progressData, setProgressData] = useState([]);
    const [completedCount, setCompletedCount] = useState(0);

    // Fetch progress data whenever the selected date changes
    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const data = await apiFetch(`/progress/${selectedDate}`);
                setProgressData(data);

                // Count completed habits
                const completed = data.filter((habit) => habit.status).length;
                setCompletedCount(completed);
            } catch (error) {
                console.error("Error fetching progress:", error);
            }
        };

        fetchProgress();
    }, [selectedDate]);

    const handleDateChange = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        if (newDate > new Date()) {
            alert("Cannot select a future date.");
            return;
        }
        setSelectedDate(newDate.toISOString().split("T")[0]);
    };

    return (
        <div className="container">
            <Header />
            <DateSelector
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                handleDateChange={handleDateChange}
            />
            <ProgressList
                habits={habits}
                progressData={progressData}
                selectedDate={selectedDate}
                setProgressData={setProgressData}
                setCompletedCount={setCompletedCount}
            />
            <Summary completedCount={completedCount} totalCount={habits.length} />
            <footer>
                <p>© 2025 Daily Progress Tracker. Built with ❤️.</p>
            </footer>
        </div>
    );
};

export default App;
