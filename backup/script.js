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
  
  // Utility Functions
  async function apiFetch(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
  
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, { ...options, headers });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "An error occurred");
      }
      return await response.json();
    } catch (error) {
      showError(error.message || "Failed to communicate with the server.");
      console.error("API Fetch Error:", error);
      throw error;
    }
  }
  
  function toggleLoading(show) {
    if (loadingIndicator) {
      loadingIndicator.style.display = show ? "block" : "none";
    }
  }
  
  function showError(message) {
    let errorElement = document.getElementById("error-message");
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.id = "error-message";
      errorElement.className = "error-message";
      document.body.appendChild(errorElement);
    }
    errorElement.textContent = message;
    errorElement.style.display = "block";
    setTimeout(() => (errorElement.style.display = "none"), 5000);
  }
  
  function getCurrentDate() {
    return dateInput.value || new Date().toISOString().split("T")[0];
  }
  
  // Streak & UI Updates
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
  
  function updateStreakProgress(habitElement, streak) {
    const progressFill = habitElement.querySelector(".streak-progress-fill");
    const streakBadge = habitElement.querySelector(".streak-badge");
    if (!progressFill || !streakBadge) return;
  
    progressFill.style.width = `${Math.min(streak * 10, 100)}%`;
    streakBadge.textContent = streak;
    celebrateMilestone(streak);
  }
  
  function updateSummary(completedCount, totalHabits) {
    const completionPercentage = Math.round((completedCount / totalHabits) * 100);
    completedCountElement.textContent = `Completed: ${completedCount} / ${totalHabits}`;
    completionPercentageElement.textContent = `Completion: ${completionPercentage}%`;
  }
  
  // Creating / Rendering
  function createHabitElement(habit, isChecked, streak) {
    const habitElement = document.createElement("div");
    habitElement.className = `habit ${isChecked ? "completed" : ""}`;
    habitElement.id = `habit-${habit}`;
  
    habitElement.innerHTML = `
      <div>
        <span class="habit-name">${habit}</span>
        <div class="streak-progress">
          <div class="streak-progress-fill" style="width: ${Math.min(streak * 10, 100)}%;"></div>
        </div>
      </div>
      <div>
        <span class="streak-badge" aria-label="Streak count">${streak}</span>
        <label class="switch" aria-label="Mark ${habit} as complete">
          <input type="checkbox" ${isChecked ? "checked" : ""}>
          <span class="slider"></span>
        </label>
      </div>
    `;
  
    const checkbox = habitElement.querySelector("input[type='checkbox']");
  
    let prevChecked = isChecked;
  
    checkbox.addEventListener("change", async () => {
      try {
        checkbox.disabled = true;
        habitElement.classList.toggle("completed", checkbox.checked);
  
        const updatedHabit = await apiFetch("/progress/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: getCurrentDate(),
            habit,
            status: checkbox.checked,
          }),
        });
  
        updateStreakProgress(habitElement, updatedHabit.streak || 0);
  
        if (checkbox.checked && !prevChecked) {
          localCompletedCount++;
        } else if (!checkbox.checked && prevChecked) {
          localCompletedCount--;
        }
        updateSummary(localCompletedCount, habits.length);
  
        prevChecked = checkbox.checked;
      } catch (error) {
        checkbox.checked = prevChecked;
        habitElement.classList.toggle("completed", prevChecked);
      } finally {
        checkbox.disabled = false;
      }
    });
  
    return habitElement;
  }
  
  // Main Logic
  let localCompletedCount = 0;
  
  async function loadProgress(date) {
    try {
      toggleLoading(true);
      const data = await apiFetch(`/progress/${date}`);
      progressList.innerHTML = "";
      localCompletedCount = 0;
  
      const fragment = document.createDocumentFragment();
  
      habits.forEach((habit) => {
        const habitData = data.find((h) => h.habit === habit);
        const isChecked = habitData?.status || false;
        const streak = habitData?.streak || 0;
  
        if (isChecked) localCompletedCount++;
  
        const habitElement = createHabitElement(habit, isChecked, streak);
        fragment.appendChild(habitElement);
      });
  
      progressList.appendChild(fragment);
      updateSummary(localCompletedCount, habits.length);
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      toggleLoading(false);
    }
  }
  
  function changeDate(days) {
    const current = new Date(getCurrentDate());
    current.setDate(current.getDate() + days);
  
    const newDate = current.toISOString().split("T")[0];
    if (new Date(newDate) > new Date()) {
      showError("Cannot select a future date.");
      return;
    }
  
    dateInput.value = newDate;
    loadProgress(newDate);
  }
  
  // Initialize on page load
  document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    loadProgress(today);
  
    document.getElementById("prev-date").addEventListener("click", () => changeDate(-1));
    document.getElementById("next-date").addEventListener("click", () => changeDate(1));
  });
  