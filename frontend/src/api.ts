    import { WeeklyData, RawHabit, Habit } from './types';
const apiUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:8001"; // Fallback for development
/**
 * Generic function to fetch data from the API.
 * @param endpoint - The API endpoint to call.
 * @param options - Fetch options (method, headers, body, etc.).
 * @returns The parsed JSON response.
 * @throws Throws an error if the request fails.
 */
export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem('authToken');
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
    };

    try {
        const response = await fetch(`${apiUrl}${endpoint}`, { ...options, headers });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`API Fetch Error on ${endpoint}: ${error.message}`);
        }
        // Handle non-Error objects
        throw new Error(`API Fetch Error on ${endpoint}: ${String(error)}`);
    }
}

/**
 * Fetch habits for a specific date.
 * @param date - The date (YYYY-MM-DD) for which to fetch habits.
 * @returns The list of habits.
 */
export async function fetchHabitsApi(date: string): Promise<any> {
    return apiFetch<any>(`/progress/${date}`);
}

/**
 * Update a specific habit.
 * @param habitId - The ID of the habit to update.
 * @param body - The request body (e.g., { status: true }).
 * @returns The updated habit.
 */
export async function updateHabitApi(
    habitId: number,
    body: Partial<Habit>
): Promise<Habit> {
    if (!habitId || habitId <= 0) {
        throw new Error("Invalid habitId provided for updateHabitApi.");
    }

    return apiFetch<Habit>(`/progress/${habitId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}


/**
 * Fetch weekly habits data and process it into a structured format.
 * @returns The weekly habits data.
 */
export async function fetchWeeklyHabitsApi(): Promise<WeeklyData[]> {
    const rawData = await apiFetch<RawHabit[]>('/progress/weekly');

    const processedData: WeeklyData[] = rawData.reduce((acc, item: RawHabit) => {
        const existingDay = acc.find(entry => entry.date === item.date);
        if (existingDay) {
            existingDay.completed += item.status ? 1 : 0;
            existingDay.total += 1;
        } else {
            acc.push({
                date: item.date,
                completed: item.status ? 1 : 0,
                total: 1,
            });
        }
        return acc;
    }, [] as WeeklyData[]);

    return processedData;
}
/**
 * POST the Google ID token to our backend to log in or sign up the user.
 * @param idToken - The Google ID token received from the front-end
 * @returns The user info and access token from the backend
 */
export async function googleSignInApi(idToken: string): Promise<{
    access_token: string;
    token_type: string;
    user: {
        id: number;
        email: string;
        name: string;
        avatar_url: string;
    }
}> {
    return apiFetch("/auth/google", {
        method: "POST",
        body: JSON.stringify({ id_token: idToken }),
    });
}

/**
 * Fetch analytics data.
 * @param startDate - The start date for the analytics data (YYYY-MM-DD).
 * @param endDate - The end date for the analytics data (YYYY-MM-DD).
 * @returns The analytics data.
 */
export async function fetchAnalyticsApi(startDate: string, endDate: string): Promise<any> {
    return apiFetch<any>(`/analytics?start=${startDate}&end=${endDate}`);
}