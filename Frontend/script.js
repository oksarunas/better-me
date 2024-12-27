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

// Fetch progress for the selected date
async function loadProgress(date) {
    const response = await fetch(`${apiUrl}/progress/${date}`);
    const data = await response.json();

    const progressList = document.getElementById("progress-list");
    progressList.innerHTML = "";

    habits.forEach((habit) => {
        const habitData = data.find((h) => h.habit === habit);
        const isChecked = habitData ? habitData.status : false;

        const habitElement = document.createElement("div");
        habitElement.className = "habit";
        habitElement.innerHTML = `
            <span>${habit}</span>
            <label class="switch">
                <input type="checkbox" ${isChecked ? "checked" : ""} 
                       onchange="updateProgress('${habit}', this.checked)">
                <span class="slider"></span>
            </label>
        `;
        progressList.appendChild(habitElement);
    });
}

// Update progress for a habit
async function updateProgress(habit, status) {
    const date = document.getElementById("progress-date").value;
    await fetch(`${apiUrl}/progress/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ date, habit, status }),
    });
    loadProgress(date);
}

// Handle date changes
document.getElementById("progress-date").addEventListener("change", (event) => {
    const date = event.target.value;
    loadProgress(date);
});

// Set today's date and load progress
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split("T")[0];
    const dateInput = document.getElementById("progress-date");
    dateInput.value = today;
    loadProgress(today);
});
