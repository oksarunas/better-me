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

const apiUrl = "http://localhost:9000"; // Backend URL

// Get DOM elements once
const progressList = document.getElementById("progress-list");
const dateInput = document.getElementById("progress-date");
const loadingIndicator = document.getElementById("loading");
const completedCountElement = document.getElementById("completed-count");
const completionPercentageElement = document.getElementById("completion-percentage");

// Show or hide loading indicator
function toggleLoading(show) {
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? "block" : "none";
    }
}

// Fetch progress data from the backend
async function fetchProgress(date) {
    const response = await fetch(`${apiUrl}/progress/${date}`);
    if (!response.ok) throw new Error("Failed to fetch progress data");
    return await response.json();
}

// Create a habit element
function createHabitElement(habit, isChecked, streak) {
    const habitElement = document.createElement("div");
    habitElement.className = "habit";

    habitElement.innerHTML = `
        <span>${habit} <span class="streak">Streak: ${streak} days</span></span>
        <label class="switch">
            <input type="checkbox" ${isChecked ? "checked" : ""}>
            <span class="slider"></span>
        </label>
    `;

    // Add event listener for checkbox
    const checkbox = habitElement.querySelector("input[type='checkbox']");
    checkbox.addEventListener("change", () => updateProgress(habit, checkbox.checked));

    return habitElement;
}

// Update the summary section
function updateSummary(completedCount, totalHabits) {
    const completionPercentage = Math.round((completedCount / totalHabits) * 100);
    completedCountElement.textContent = `Completed: ${completedCount} / ${totalHabits}`;
    completionPercentageElement.textContent = `Completion: ${completionPercentage}%`;
}

// Load progress for the selected date
async function loadProgress(date) {
    try {
        toggleLoading(true); // Show loading indicator
        const data = await fetchProgress(date);

        // Clear and populate progress list
        progressList.innerHTML = "";

        let completedCount = 0; // Counter for completed habits
        const fragment = document.createDocumentFragment();

        habits.forEach((habit) => {
            const habitData = data.find((h) => h.habit === habit);
            const isChecked = habitData ? habitData.status : false;
            const streak = habitData && habitData.streak ? habitData.streak : 0;

            // Increment completed count
            if (isChecked) completedCount++;

            // Create and append habit element
            const habitElement = createHabitElement(habit, isChecked, streak);
            fragment.appendChild(habitElement);
        });

        progressList.appendChild(fragment);

        // Update summary
        updateSummary(completedCount, habits.length);
    } catch (error) {
        console.error("Error loading progress:", error);
        alert("Failed to load progress. Please try again later.");
    } finally {
        toggleLoading(false); // Hide loading indicator
    }
}

// Update progress for a habit
async function updateProgress(habit, status) {
    const date = dateInput.value;
    try {
        toggleLoading(true); // Show loading indicator
        const response = await fetch(`${apiUrl}/progress/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ date, habit, status }),
        });
        if (!response.ok) throw new Error("Failed to update progress");
        await loadProgress(date); // Reload progress after updating
    } catch (error) {
        console.error("Error updating progress:", error);
        alert("Failed to update progress. Please try again.");
    } finally {
        toggleLoading(false); // Hide loading indicator
    }
}

// Handle date changes
dateInput.addEventListener("change", (event) => {
    const date = event.target.value;
    loadProgress(date);
});

// Set today's date and load progress on page load
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    loadProgress(today);
});
