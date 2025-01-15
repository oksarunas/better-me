const apiUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:8001"; // Fallback for development

/**
 * Generic function to fetch data from the API.
 * @param {string} endpoint - The API endpoint to call.
 * @param {object} options - Fetch options (method, headers, body, etc.).
 * @returns {Promise<any>} - The parsed JSON response.
 * @throws {Error} - Throws an error if the request fails.
 */
export async function apiFetch(endpoint, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    try {
        const response = await fetch(`${apiUrl}${endpoint}`, { ...options, headers });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Fetch Error on ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Fetch habits for a specific date.
 * @param {string} date - The date (YYYY-MM-DD) for which to fetch habits.
 * @returns {Promise<any>} - The list of habits.
 */
export async function fetchHabitsApi(date) {
    return apiFetch(`/progress/${date}`);
}

/**
 * Update a specific habit.
 * @param {number} habitId - The ID of the habit to update.
 * @param {object} body - The request body (e.g., { status: true }).
 * @returns {Promise<any>} - The updated habit.
 */
export async function updateHabitApi(habitId, body) {
    return apiFetch(`/progress/${habitId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}
