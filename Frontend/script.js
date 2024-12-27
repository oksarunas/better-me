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
        console.error("API Fetch Error:", error);
        alert(error.message || "Failed to communicate with the server.");
        throw error;
    }
}

// Show or hide loading indicator
function toggleLoading(show) {
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? "block" : "none";
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
        toggleLoading(true); // Show loading indicator
        const data = await apiFetch(`/progress/${date}`);

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
    } finally {
        toggleLoading(false); // Hide loading indicator
    }
}

// Update progress for a habit
async function updateProgress(habit, status) {
    const date = dateInput.value;
    try {
        toggleLoading(true); // Show loading indicator
        await apiFetch("/progress/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ date, habit, status }),
        });
        await loadProgress(date); // Reload progress after updating
    } catch (error) {
        console.error("Error updating progress:", error);
    } finally {
        toggleLoading(false); // Hide loading indicator
    }
}

// Save all progress in bulk
async function saveProgress() {
    const date = dateInput.value;
    const updates = Array.from(progressList.querySelectorAll(".habit")).map(habitElement => {
        const habitName = habitElement.querySelector("span").textContent.split(" Streak")[0];
        const isChecked = habitElement.querySelector("input[type='checkbox']").checked;
        return { habit: habitName, status: isChecked };
    });

    try {
        toggleLoading(true); // Show loading indicator
        await apiFetch("/progress/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, updates }),
        });
        alert("Progress saved successfully!");
    } catch (error) {
        console.error("Error saving progress:", error);
    } finally {
        toggleLoading(false); // Hide loading indicator
    }
}

// Handle date navigation
function changeDate(days) {
    const date = new Date(dateInput.value);
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
