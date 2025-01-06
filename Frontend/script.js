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

  // ===============
  // Utility Functions
  // ===============
  async function apiFetch(endpoint, options = {}) {
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, options);
      if (!response.ok) {
        // Attempt to parse error JSON; fallback to generic
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
    const errorElement = document.getElementById("error-message");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
      setTimeout(() => (errorElement.style.display = "none"), 5000);
    }
  }

  function getCurrentDate() {
    return dateInput.value || new Date().toISOString().split("T")[0];
  }

  // ===============
  // Streak & UI Updates
  // ===============
  function celebrateMilestone(streak) {
    // Confetti on multiples of 5
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

  // ===============
  // Creating / Rendering
  // ===============
  function createHabitElement(habit, isChecked, streak) {
    const habitElement = document.createElement("div");
    habitElement.className = `habit ${isChecked ? "completed" : ""}`;
    habitElement.id = `habit-${habit}`;

    habitElement.innerHTML = `
      <div>
        <span>${habit}</span>
        <div class="streak-progress">
          <div class="streak-progress-fill" 
               style="width: ${Math.min(streak * 10, 100)}%;">
          </div>
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

    const checkbox = habitElement.querySelector("input[type='checkbox']");

    // Keep track of the previous checkbox state, in case we need to revert on error
    let prevChecked = isChecked;

    checkbox.addEventListener("change", async () => {
      try {
        checkbox.disabled = true; // prevent double-click
        habitElement.classList.toggle("completed", checkbox.checked);

        // Send to backend
        const updatedHabit = await apiFetch("/progress/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: getCurrentDate(),
            habit,
            status: checkbox.checked,
          }),
        });

        // The backend returns something like { habit, date, status, streak }
        // Update the UI with the new streak
        updateStreakProgress(habitElement, updatedHabit.streak || 0);

        // Optionally update the summary count locally:
        if (checkbox.checked && !prevChecked) {
          // increment
          localCompletedCount++;
        } else if (!checkbox.checked && prevChecked) {
          // decrement
          localCompletedCount--;
        }
        updateSummary(localCompletedCount, habits.length);

        // Save the new "previous" state
        prevChecked = checkbox.checked;
      } catch (error) {
        // Revert the checkbox if update failed
        checkbox.checked = prevChecked;
        habitElement.classList.toggle("completed", prevChecked);
      } finally {
        checkbox.disabled = false;
      }
    });

    return habitElement;
  }

  function updateSummary(completedCount, totalHabits) {
    const completionPercentage = Math.round((completedCount / totalHabits) * 100);
    completedCountElement.textContent = `Completed: ${completedCount} / ${totalHabits}`;
    completionPercentageElement.textContent = `Completion: ${completionPercentage}%`;
  }

  // ===============
  // Main Logic
  // ===============
  let localCompletedCount = 0; // track how many are completed in the UI

  async function loadProgress(date) {
    try {
      console.log(`Fetching progress for date: ${date}`); // Log the date being queried
  
      toggleLoading(true);
  
      // Fetch progress data from the backend
      const data = await apiFetch(`/progress/${date}`);
      console.log("API Response:", data); // Log the full response from the backend
  
      progressList.innerHTML = "";
  
      // Reset local count before we reconstruct
      localCompletedCount = 0;
  
      const fragment = document.createDocumentFragment();
  
      // Loop through all habits and match with backend data
      habits.forEach((habit) => {
        const habitData = data.find((h) => h.habit === habit);
        console.log(`Processing habit: ${habit}`, habitData); // Log habit data
  
        const isChecked = habitData?.status || false;
        const streak = habitData?.streak || 0;
  
        if (isChecked) localCompletedCount++;
  
        // Create the habit element and add it to the fragment
        const habitElement = createHabitElement(habit, isChecked, streak);
        fragment.appendChild(habitElement);
      });
  
      // Append all habits to the DOM
      progressList.appendChild(fragment);
  
      // Update the summary
      updateSummary(localCompletedCount, habits.length);
  
      console.log(`Completed: ${localCompletedCount} / ${habits.length}`); // Log completion count
    } catch (error) {
      console.error("Error loading progress:", error); // Log any errors
    } finally {
      toggleLoading(false);
    }
  }
  


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