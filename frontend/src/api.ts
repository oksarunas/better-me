import { WeeklyData, Habit, AnalyticsData, User } from './types'; // Added User
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

export async function googleSignInApi(idToken: string): Promise<{
    access_token: string;
    token_type: string;
    user: User;
}> {
    return apiFetch("/auth/google", { method: "POST", data: { id_token: idToken } });
}

export async function fetchHabitsApi(date: string): Promise<Habit[]> {
    return apiFetch<Habit[]>(`/progress/${date}`);
}

export async function updateHabitApi(habitId: number, body: Partial<Habit>): Promise<Habit> {
    if (!habitId || habitId <= 0) throw new Error("Invalid habitId provided for updateHabitApi");
    return apiFetch<Habit>(`/progress/${habitId}`, { method: "PATCH", data: body });
}

export async function fetchWeeklyHabitsApi(): Promise<WeeklyData[]> {
    return apiFetch<WeeklyData[]>('/progress/weekly');
}

export async function fetchAnalyticsApi(days: number = 30): Promise<AnalyticsData> {
    return apiFetch<AnalyticsData>(`/analytics/completion?days=${days}`);
}

export async function createHabitApi(habit: Omit<Habit, 'id' | 'streak'>): Promise<Habit> {
    return apiFetch<Habit>('/habits', { method: "POST", data: habit });
}