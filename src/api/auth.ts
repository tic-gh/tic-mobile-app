import axios from 'axios';
import { apiClient } from './base';

// Types for login request and response
export interface LoginRequest {
  username: string;
  password: string;
  captcha?: string;
  version?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
}

export interface User {
  id: number;
  group_id: number | null;
  email: string;
  client_code: string | null;
  username: string;
  status: number;
  user_status: string | null;
  levelState: number;
  category: string;
  user_type: string | null;
  is_online: number;
  password_reset: string | null;
  created_at: string;
  updated_at: string;
}

// Login function
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/login', credentials);
    return {
      success: true,
      token: response.data.token,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle specific HTTP errors
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 405) {
          return {
            success: false,
            message: 'app_outdated',
          };
        }
        return {
          success: false,
          message: 'error_credential',
        };
      } else if (error.request) {
        // Request was made but no response received
        return {
          success: false,
          message: 'Network error: No response from server',
        };
      }
    }

    // Generic error handling
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
};

// Logout function (if needed)
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/logout');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Get user information
export const getUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<{ user: User }>('/user');

    return response.data.user;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        throw new Error(
          error.response.data?.message ||
            `HTTP ${error.response.status}: ${error.response.statusText}`
        );
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('Network error: No response from server');
      }
    }

    // Re-throw the error
    throw error;
  }
};

export default {
  login,
  logout,
  getUser,
};
