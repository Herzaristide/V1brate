import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { Music, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      if (error) {
        toast.error(`Authentication failed: ${error}`);
        navigate('/login');
        return;
      }

      if (!token || !refreshToken) {
        toast.error('No authentication tokens received');
        navigate('/login');
        return;
      }

      try {
        // Handle OAuth callback
        authService.handleOAuthCallback(token, refreshToken);

        // Get user info
        const user = await authService.getCurrentUser();
        updateUser(user);

        toast.success('Successfully logged in!');
        navigate('/dashboard');
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, updateUser]);

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center'>
        <div className='flex items-center justify-center space-x-2 mb-6'>
          <Music className='h-10 w-10 text-primary-600' />
          <span className='text-2xl font-bold text-gray-900 dark:text-white'>
            V1brate
          </span>
        </div>
        <div className='flex items-center justify-center space-x-3 mb-4'>
          <Loader className='h-6 w-6 animate-spin text-primary-600' />
          <span className='text-lg text-gray-600 dark:text-gray-300'>
            Completing authentication...
          </span>
        </div>
        <p className='text-sm text-gray-500 dark:text-gray-400'>
          Please wait while we sign you in
        </p>
      </div>
    </div>
  );
}
