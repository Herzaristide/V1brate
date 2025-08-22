import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Monitor, Music, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const ThemeIcon = themeIcons[theme];

  return (
    <nav className='fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <Link to='/' className='flex items-center space-x-2'>
            <Music className='h-8 w-8 text-primary-600' />
            <span className='text-xl font-bold text-gray-900 dark:text-white'>
              V1brate
            </span>
          </Link>

          {/* Navigation Links */}
          <div className='hidden md:flex items-center space-x-6'>
            {isAuthenticated ? (
              <>
                <Link
                  to='/dashboard'
                  className='text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors'
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to='/login'
                  className='text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors'
                >
                  Login
                </Link>
                <Link to='/register' className='btn-primary'>
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Right side controls */}
          <div className='flex items-center space-x-4'>
            {/* Theme toggle */}
            <div className='relative'>
              <button
                onClick={() => {
                  const themes: Array<'light' | 'dark' | 'system'> = [
                    'light',
                    'dark',
                    'system',
                  ];
                  const currentIndex = themes.indexOf(theme);
                  const nextTheme = themes[(currentIndex + 1) % themes.length];
                  setTheme(nextTheme);
                }}
                className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                title={`Current theme: ${theme}`}
              >
                <ThemeIcon className='h-5 w-5 text-gray-600 dark:text-gray-300' />
              </button>
            </div>

            {/* User menu */}
            {isAuthenticated && user ? (
              <div className='flex items-center space-x-3'>
                <div className='flex items-center space-x-2'>
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.displayName || user.email}
                      className='h-8 w-8 rounded-full'
                    />
                  ) : (
                    <div className='h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center'>
                      <User className='h-5 w-5 text-white' />
                    </div>
                  )}
                  <span className='hidden sm:block text-sm font-medium text-gray-900 dark:text-white'>
                    {user.displayName || user.username || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                  title='Logout'
                >
                  <LogOut className='h-5 w-5 text-gray-600 dark:text-gray-300' />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
