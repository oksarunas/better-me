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

const apiUrl = "https://betterme.website/api";

// DOM elements
const progressList = document.getElementById("progress-list");
const dateInput = document.getElementById("progress-date");
const loadingIndicator = document.getElementById("loading");
const completedCountElement = document.getElementById("completed-count");
const completionPercentageElement = document.getElementById("completion-percentage");

// =======================
//  Utility Functions
// =======================

// Generic API call
async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${apiUrl}${endpoint}`, options);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "An error occurred");
        }
        return await response.json();
    } catch (error) {
        showError(error.message || "Failed to communicate with the server.");
        console.error("API Fetch Error:", error);
        throw error;
    }
}

// Show/hide loading indicator
function toggleLoading(show) {
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? "block" : "none";
    }
}

// Display error messages
function showError(message) {
    const errorElement = document.getElementById("error-message");
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
        setTimeout(() => (errorElement.style.display = "none"), 5000);
    }
}

// Get or set the current date
function getCurrentDate() {
    return dateInput.value || new Date().toISOString().split("T")[0];
}

// =======================
//  Streak & UI Updates
// =======================

// Celebrate milestone streaks
function celebrateMilestone(streak) {
    if (streak % 5 === 0 && streak > 0) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        document.body.appendChild(confetti);

        setTimeout(() => {
            document.body.removeChild(confetti);
        }, 3000);
    }
}

// Update streak progress bar and streak badge
function updateStreakProgress(habitElement, streak) {
    const progressFill = habitElement.querySelector(".streak-progress-fill");
    const streakBadge = habitElement.querySelector(".streak-badge");
    if (!progressFill || !streakBadge) return;

    // Update progress bar width
    progressFill.style.width = `${Math.min(streak * 10, 100)}%`;

    // Update streak badge text
    streakBadge.textContent = streak;

    // Trigger celebration for milestone streaks
    celebrateMilestone(streak);
}

// =======================
//  Creating / Rendering
// =======================

// Create a habit card element
function createHabitElement(habit, isChecked, streak) {
    const habitElement = document.createElement("div");
    habitElement.className = `habit ${isChecked ? "completed" : ""}`;
    habitElement.id = `habit-${habit}`;

    habitElement.innerHTML = `
        <div>
            <span>${habit}</span>
            <div class="streak-progress">
                <div class="streak-progress-fill" style="width: ${Math.min(
                    streak * 10,
                    100
                )}%;"></div>
            </div>
        </div>
        <div>
            <span class="streak-badge">${streak}</span>
            <label class="switch">
                <input type="checkbox" ${isChecked ? "checked" : ""}>
                <span class="slider"></span>
            </label>
        </div>
    `;

    // Listen for checkbox changes
    const checkbox = habitElement.querySelector("input[type='checkbox']");
    checkbox.addEventListener("change", () => {
        // Toggle UI completion state
        habitElement.classList.toggle("completed", checkbox.checked);

        // Save progress to backend & update streak
        updateProgress(habit, checkbox.checked);
    });

    return habitElement;
}

// Update summary with completed habit count and completion percentage
function updateSummary(completedCount, totalHabits) {
    const completionPercentage = Math.round((completedCount / totalHabits) * 100);
    completedCountElement.textContent = `Completed: ${completedCount} / ${totalHabits}`;
    completionPercentageElement.textContent = `Completion: ${completionPercentage}%`;
}

// =======================
//  Main Logic
// =======================

// Load progress for a specific date, then render habit cards
async function loadProgress(date) {
    try {
        toggleLoading(true);
        const data = await apiFetch(`/progress/${date}`);
        progressList.innerHTML = "";

        let completedCount = 0;
        const fragment = document.createDocumentFragment();

        habits.forEach((habit) => {
            const habitData = data.find((h) => h.habit === habit);
            const isChecked = habitData?.status || false;
            const streak = habitData?.streak || 0;

            if (isChecked) completedCount++;

            const habitElement = createHabitElement(habit, isChecked, streak);
            fragment.appendChild(habitElement);
        });

        progressList.appendChild(fragment);
        updateSummary(completedCount, habits.length);
    } catch (error) {
        console.error("Error loading progress:", error);
    } finally {
        toggleLoading(false);
    }
}

// Update progress on the backend and then adjust the streak dynamically
async function updateProgress(habit, status) {
    try {
        toggleLoading(true);

        // Save updated progress
        await apiFetch("/progress/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: getCurrentDate(), habit, status }),
        });

        // Update streak in the UI
        const habitElement = document.getElementById(`habit-${habit}`);
        if (habitElement) {
            const currentStreak = parseInt(habitElement.querySelector(".streak-badge").textContent) || 0;
            const newStreak = status ? currentStreak + 1 : Math.max(currentStreak - 1, 0);

            updateStreakProgress(habitElement, newStreak);
        }
    } catch (error) {
        console.error("Error updating progress:", error);
    } finally {
        toggleLoading(false);
    }
}

// Handle date navigation
function changeDate(days) {
    const current = new Date(getCurrentDate());
    current.setDate(current.getDate() + days);
    dateInput.value = current.toISOString().split("T")[0];
    loadProgress(dateInput.value);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    loadProgress(today);

    document.getElementById("prev-date").addEventListener("click", () => changeDate(-1));
    document.getElementById("next-date").addEventListener("click", () => changeDate(1));
});
