import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className='min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8'>
      <div className='text-center'>
        <div className='flex items-center justify-center space-x-2 mb-8'>
          <Music className='h-12 w-12 text-primary-600' />
          <span className='text-3xl font-bold text-gray-900 dark:text-white'>
            V1brate
          </span>
        </div>

        <div className='mb-8'>
          <h1 className='text-6xl font-bold text-gray-900 dark:text-white mb-4'>
            404
          </h1>
          <h2 className='text-2xl font-semibold text-gray-600 dark:text-gray-300 mb-2'>
            Page Not Found
          </h2>
          <p className='text-gray-500 dark:text-gray-400 max-w-md mx-auto'>
            Sorry, we couldn't find the page you're looking for. It might have
            been moved, deleted, or you might have typed the wrong URL.
          </p>
        </div>

        <div className='space-y-4'>
          <Link
            to='/'
            className='inline-flex items-center space-x-2 btn-primary'
          >
            <Home className='h-5 w-5' />
            <span>Go Home</span>
          </Link>

          <div className='text-sm text-gray-500 dark:text-gray-400'>
            <p>
              If you think this is an error, please{' '}
              <a
                href='mailto:support@v1brate.com'
                className='text-primary-600 hover:text-primary-500'
              >
                contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
