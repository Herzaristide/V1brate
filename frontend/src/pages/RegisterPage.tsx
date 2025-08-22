import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { Mail, Lock, Eye, EyeOff, User, Music } from 'lucide-react';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
  displayName?: string;
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        username: data.username,
        displayName: data.displayName,
      });
      navigate('/dashboard');
    } catch (error) {
      // Error handling is done in the AuthContext
    }
  };

  const handleOAuthLogin = (provider: 'google' | 'discord') => {
    const authUrl =
      provider === 'google'
        ? authService.getGoogleAuthUrl()
        : authService.getDiscordAuthUrl();

    window.location.href = authUrl;
  };

  return (
    <div className='min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        {/* Header */}
        <div className='text-center'>
          <div className='flex items-center justify-center space-x-2 mb-6'>
            <Music className='h-10 w-10 text-primary-600' />
            <span className='text-2xl font-bold text-gray-900 dark:text-white'>
              V1brate
            </span>
          </div>
          <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>
            Create your account
          </h2>
          <p className='mt-2 text-gray-600 dark:text-gray-300'>
            Start your musical journey with advanced training tools
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className='space-y-3'>
          <button
            type='button'
            onClick={() => handleOAuthLogin('google')}
            className='w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
          >
            <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
              <path
                fill='currentColor'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='currentColor'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='currentColor'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='currentColor'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            Sign up with Google
          </button>

          <button
            type='button'
            onClick={() => handleOAuthLogin('discord')}
            className='w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
          >
            <svg
              className='w-5 h-5 mr-2'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9460 2.4189-2.1568 2.4189Z' />
            </svg>
            Sign up with Discord
          </button>
        </div>

        {/* Divider */}
        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-300 dark:border-gray-600' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400'>
              Or continue with email
            </span>
          </div>
        </div>

        {/* Register Form */}
        <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            <div>
              <label
                htmlFor='username'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
              >
                Username (optional)
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <User className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  id='username'
                  type='text'
                  autoComplete='username'
                  {...register('username')}
                  className='input-field pl-10'
                  placeholder='username'
                />
              </div>
            </div>

            <div>
              <label
                htmlFor='displayName'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
              >
                Display Name (optional)
              </label>
              <input
                id='displayName'
                type='text'
                autoComplete='name'
                {...register('displayName')}
                className='input-field'
                placeholder='John Doe'
              />
            </div>
          </div>

          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
            >
              Email address *
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Mail className='h-5 w-5 text-gray-400' />
              </div>
              <input
                id='email'
                type='email'
                autoComplete='email'
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className='input-field pl-10'
                placeholder='Enter your email'
              />
            </div>
            {errors.email && (
              <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
            >
              Password *
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Lock className='h-5 w-5 text-gray-400' />
              </div>
              <input
                id='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='new-password'
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                className='input-field pl-10 pr-10'
                placeholder='Create a password'
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className='h-5 w-5 text-gray-400' />
                ) : (
                  <Eye className='h-5 w-5 text-gray-400' />
                )}
              </button>
            </div>
            {errors.password && (
              <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
            >
              Confirm Password *
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Lock className='h-5 w-5 text-gray-400' />
              </div>
              <input
                id='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete='new-password'
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
                className='input-field pl-10 pr-10'
                placeholder='Confirm your password'
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className='h-5 w-5 text-gray-400' />
                ) : (
                  <Eye className='h-5 w-5 text-gray-400' />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {/* Login Link */}
        <div className='text-center'>
          <p className='text-sm text-gray-600 dark:text-gray-300'>
            Already have an account?{' '}
            <Link
              to='/login'
              className='font-medium text-primary-600 hover:text-primary-500'
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
