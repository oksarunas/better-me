import { axiosInstance } from './axios-config';

export interface ProfileUpdateData {
  name?: string;
  email?: string;
}

export interface ProfileUpdateResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface AvatarUpdateResponse {
  message: string;
  avatar_url: string;
}

export const updateProfile = async (data: ProfileUpdateData): Promise<ProfileUpdateResponse> => {
  const response = await axiosInstance.put<ProfileUpdateResponse>('/profile/update', data);
  return response.data;
};

export const uploadAvatar = async (file: File): Promise<AvatarUpdateResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axiosInstance.post<AvatarUpdateResponse>('/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
