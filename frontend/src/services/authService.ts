import { api } from './api';
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../types';
import Cookies from 'js-cookie';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      '/api/auth/login',
      credentials
    );
    const { accessToken, refreshToken, user } = response.data;

    // Store tokens in cookies
    Cookies.set('access_token', accessToken, { expires: 1 / 96 }); // 15 minutes
    Cookies.set('refresh_token', refreshToken, { expires: 7 }); // 7 days

    return response.data;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      '/api/auth/register',
      credentials
    );
    const { accessToken, refreshToken, user } = response.data;

    // Store tokens in cookies
    Cookies.set('access_token', accessToken, { expires: 1 / 96 }); // 15 minutes
    Cookies.set('refresh_token', refreshToken, { expires: 7 }); // 7 days

    return response.data;
  }

  async refreshToken(): Promise<string> {
    const refreshToken = Cookies.get('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<{
      accessToken: string;
      refreshToken: string;
    }>('/api/auth/refresh', {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    // Update stored tokens
    Cookies.set('access_token', accessToken, { expires: 1 / 96 }); // 15 minutes
    Cookies.set('refresh_token', newRefreshToken, { expires: 7 }); // 7 days

    return accessToken;
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/users/me');
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
    }
  }

  getAccessToken(): string | undefined {
    return Cookies.get('access_token');
  }

  getRefreshToken(): string | undefined {
    return Cookies.get('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken() || !!this.getRefreshToken();
  }

  // OAuth URLs (to be implemented when OAuth is added to backend)
  getGoogleAuthUrl(): string {
    return `${
      process.env.REACT_APP_API_URL || 'http://localhost:3001'
    }/api/auth/google`;
  }

  getDiscordAuthUrl(): string {
    return `${
      process.env.REACT_APP_API_URL || 'http://localhost:3001'
    }/api/auth/discord`;
  }

  // Handle OAuth callback
  handleOAuthCallback(accessToken: string, refreshToken: string): void {
    Cookies.set('access_token', accessToken, { expires: 1 / 96 });
    Cookies.set('refresh_token', refreshToken, { expires: 7 });
  }
}

export const authService = new AuthService();
export default authService;
