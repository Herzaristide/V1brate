import { api } from './api';
import { User, UserStats, UserActivity, PaginatedResponse } from '../types';

class UserService {
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/users/me');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/api/users/me', data);
    return response.data;
  }

  async getUserStats(): Promise<UserStats> {
    const response = await api.get<UserStats>('/api/users/me/stats');
    return response.data;
  }

  async getUserActivities(
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<UserActivity>> {
    const response = await api.get<PaginatedResponse<UserActivity>>(
      '/api/users/me/activities',
      {
        params: { page, limit },
      }
    );
    return response.data;
  }

  async deleteAccount(): Promise<void> {
    await api.delete('/api/users/me');
  }
}

export const userService = new UserService();
export default userService;
