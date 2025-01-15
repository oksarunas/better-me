
import { WeeklyData, RawHabit } from './types';
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
    body: Record<string, any>
): Promise<any> {
    return apiFetch<any>(`/progress/${habitId}`, {
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