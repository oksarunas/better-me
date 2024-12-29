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

// Get DOM elements
const progressList = document.getElementById("progress-list");
const dateInput = document.getElementById("progress-date");
const loadingIndicator = document.getElementById("loading");
const completedCountElement = document.getElementById("completed-count");
const completionPercentageElement = document.getElementById("completion-percentage");

// Utility function for API calls
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

// Show or hide loading indicator
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
        setTimeout(() => (errorElement.style.display = "none"), 5000); // Auto-hide
    }
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
        toggleLoading(true);
        const data = await apiFetch(`/progress/${date}`);
        progressList.innerHTML = "";

        let completedCount = 0;
        const fragment = document.createDocumentFragment();

        habits.forEach((habit) => {
            const habitData = data.find((h) => h.habit === habit);
            const isChecked = habitData ? habitData.status : false;
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

// Update progress for a habit
async function updateProgress(habit, status) {
    try {
        toggleLoading(true);
        await apiFetch("/progress/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: getCurrentDate(), habit, status }),
        });
    } catch (error) {
        console.error("Error updating progress:", error);
    } finally {
        toggleLoading(false);
    }
}

// Save all progress in bulk
async function saveProgress() {
    const updates = Array.from(progressList.querySelectorAll(".habit")).map(habitElement => {
        const habitName = habitElement.querySelector("span").textContent.split(" Streak")[0];
        const isChecked = habitElement.querySelector("input[type='checkbox']").checked;
        return { habit: habitName, status: isChecked };
    });

    try {
        toggleLoading(true);
        await apiFetch("/progress/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: getCurrentDate(), updates }),
        });
        alert("Progress saved successfully!");
    } catch (error) {
        console.error("Error saving progress:", error);
    } finally {
        toggleLoading(false);
    }
}

// Handle date navigation
function changeDate(days) {
    const date = new Date(getCurrentDate());
    date.setDate(date.getDate() + days);
    dateInput.value = date.toISOString().split("T")[0];
    loadProgress(dateInput.value);
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    loadProgress(today);

    document.getElementById("save-progress").addEventListener("click", saveProgress);
    document.getElementById("prev-date").addEventListener("click", () => changeDate(-1));
    document.getElementById("next-date").addEventListener("click", () => changeDate(1));
});

// Utility to get the current date
function getCurrentDate() {
    return dateInput.value || new Date().toISOString().split("T")[0];
}
