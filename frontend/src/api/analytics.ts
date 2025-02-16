import { axiosInstance } from './axios-config';

export interface AnalyticsData {
  dates: string[];
  stackedData: Record<string, number[]>;
  lineData: number[];
  message: string;
  start_date: string;
  end_date: string;
}

export const getAnalytics = async (startDate: string, endDate: string): Promise<AnalyticsData> => {
  const { data } = await axiosInstance.get<AnalyticsData>('/analytics', {
    params: { start: startDate, end: endDate }
  });
  return data;
};