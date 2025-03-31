import { WeeklyData, RawHabit, Habit, AnalyticsData, User } from './types'; // Added User
import { axiosInstance } from './api/axios-config';
import axios, { type AxiosRequestConfig, AxiosError } from 'axios';

/**
 * Generic function to fetch data from the API.
 * @param endpoint - The API endpoint to call
 * @param options - Axios request configuration
 * @returns The parsed JSON response
 * @throws Throws an error if the request fails
 */
export async function apiFetch<T>(
    endpoint: string,
    options: AxiosRequestConfig<any> = {}
): Promise<T> {
    try {
        const response = await axiosInstance.request<T>({
            url: endpoint,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        });
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            const responseData = axiosError.response?.data;
            const status = axiosError.response?.status;
            const headers = axiosError.response?.headers;

            console.error('API Fetch Error Details:', {
                endpoint,
                status,
                headers,
                responseData: typeof responseData === 'string' ? responseData.substring(0, 200) : responseData
            });

            if (typeof responseData === 'string' && responseData.includes('<html')) {
                throw new Error(`API Fetch Error on ${endpoint}: Received HTML response instead of expected JSON`);
            }
            throw new Error(`API Fetch Error on ${endpoint}: ${axiosError.message}`);
        }
        console.error('Unexpected error:', error);
        throw new Error(`API Fetch Error on ${endpoint}: ${String(error)}`);
    }
}

/**
 * Authenticate user with Google ID token
 * @param idToken - The Google ID token from the front-end
 * @returns Access token, token type, and user info from the backend
 */
export async function googleSignInApi(idToken: string): Promise<{
    access_token: string;
    token_type: string;
    user: User;
}> {
    try {
        return await apiFetch("/auth/google", {
            method: "POST",
            data: { id_token: idToken }
        });
    } catch (error) {
        console.error('Error during Google sign-in:', error);
        throw error;
    }
}

/**
 * Fetch habits for a specific date
 * @param date - The date (YYYY-MM-DD) for which to fetch habits
 * @returns List of habits
 */
export async function fetchHabitsApi(date: string): Promise<Habit[]> {
    return apiFetch<Habit[]>(`/progress/${date}`);
}

/**
 * Update a specific habit
 * @param habitId - The ID of the habit to update
 * @param body - The request body with updated habit properties
 * @returns The updated habit
 */
export async function updateHabitApi(
    habitId: number,
    body: Partial<Habit>
): Promise<Habit> {
    if (!habitId || habitId <= 0) {
        throw new Error("Invalid habitId provided for updateHabitApi");
    }
    return apiFetch<Habit>(`/progress/${habitId}`, {
        method: "PATCH",
        data: body
    });
}

/**
 * Fetch and process weekly habits data
 * @returns Structured weekly habits data
 */
export async function fetchWeeklyHabitsApi(): Promise<WeeklyData[]> {
    const rawData = await apiFetch<RawHabit[]>('/progress/weekly');
    
    return rawData.reduce((acc, item: RawHabit) => {
        const existingDay = acc.find(entry => entry.date === item.date);
        if (existingDay) {
            existingDay.completed += item.status ? 1 : 0;
            existingDay.total += 1;
        } else {
            acc.push({
                date: item.date,
                completed: item.status ? 1 : 0,
                total: 1
            });
        }
        return acc;
    }, [] as WeeklyData[]);
}

/**
 * Fetch analytics data for a number of days
 * @param days - Number of days to look back (default 30)
 * @returns Analytics data
 */
export async function fetchAnalyticsApi(days: number = 30): Promise<AnalyticsData> {
    return apiFetch<AnalyticsData>(`/analytics/completion?days=${days}`);
}

/**
 * Create a new habit
 * @param habit - The habit data to create
 * @returns The created habit
 */
export async function createHabitApi(habit: Omit<Habit, 'id' | 'streak'>): Promise<Habit> {
    return apiFetch<Habit>('/habits', {
        method: "POST",
        data: habit
    });
}