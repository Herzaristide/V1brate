import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Music,
  Mic,
  BarChart3,
  Settings,
  Download,
  Zap,
  Shield,
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='pt-20 pb-16 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto text-center'>
          <div className='mb-8'>
            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6'>
              Master Your{' '}
              <span className='gradient-primary bg-clip-text text-transparent'>
                Musical Journey
              </span>
            </h1>
            <p className='text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto'>
              Advanced music training application with real-time pitch analysis,
              recording capabilities, and a customizable dashboard designed for
              musicians of all levels.
            </p>
          </div>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-12'>
            {isAuthenticated ? (
              <Link to='/dashboard' className='btn-primary text-lg px-8 py-3'>
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link to='/register' className='btn-primary text-lg px-8 py-3'>
                  Get Started Free
                </Link>
                <Link to='/login' className='btn-secondary text-lg px-8 py-3'>
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Demo Video/Image Placeholder */}
          <div className='relative max-w-4xl mx-auto'>
            <div className='card'>
              <div className='aspect-video bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center'>
                <div className='text-center'>
                  <Music className='h-16 w-16 text-primary-600 mx-auto mb-4' />
                  <p className='text-gray-600 dark:text-gray-300'>
                    Interactive Demo Coming Soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl font-bold text-gray-900 dark:text-white mb-4'>
              Everything You Need to Improve
            </h2>
            <p className='text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
              Professional-grade tools designed to help you practice smarter,
              not harder.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {/* Real-time Pitch Analysis */}
            <div className='card hover:shadow-lg transition-shadow'>
              <div className='text-center'>
                <div className='inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg mb-4'>
                  <Mic className='h-6 w-6 text-primary-600' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                  Real-time Pitch Analysis
                </h3>
                <p className='text-gray-600 dark:text-gray-300'>
                  Advanced pitch detection with accuracy feedback in cents. See
                  exactly how close you are to perfect pitch.
                </p>
              </div>
            </div>

            {/* Smart Recording */}
            <div className='card hover:shadow-lg transition-shadow'>
              <div className='text-center'>
                <div className='inline-flex items-center justify-center w-12 h-12 bg-secondary-100 dark:bg-secondary-900 rounded-lg mb-4'>
                  <BarChart3 className='h-6 w-6 text-secondary-600' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                  Smart Recording
                </h3>
                <p className='text-gray-600 dark:text-gray-300'>
                  Record practice sessions with synchronized pitch analysis data
                  for detailed review and improvement tracking.
                </p>
              </div>
            </div>

            {/* Customizable Dashboard */}
            <div className='card hover:shadow-lg transition-shadow'>
              <div className='text-center'>
                <div className='inline-flex items-center justify-center w-12 h-12 bg-accent-100 dark:bg-accent-900 rounded-lg mb-4'>
                  <Settings className='h-6 w-6 text-accent-600' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                  Customizable Dashboard
                </h3>
                <p className='text-gray-600 dark:text-gray-300'>
                  Drag, drop, and resize widgets to create your perfect practice
                  environment. Your layout, your way.
                </p>
              </div>
            </div>

            {/* PWA Features */}
            <div className='card hover:shadow-lg transition-shadow'>
              <div className='text-center'>
                <div className='inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg mb-4'>
                  <Download className='h-6 w-6 text-green-600' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                  Install Anywhere
                </h3>
                <p className='text-gray-600 dark:text-gray-300'>
                  Progressive Web App technology. Install on any device and
                  practice offline with full functionality.
                </p>
              </div>
            </div>

            {/* Multi-Key Support */}
            <div className='card hover:shadow-lg transition-shadow'>
              <div className='text-center'>
                <div className='inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg mb-4'>
                  <Zap className='h-6 w-6 text-orange-600' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                  Multi-Key Support
                </h3>
                <p className='text-gray-600 dark:text-gray-300'>
                  Practice in any musical key with support for both ABC notation
                  and Do-Ré-Mi solfège systems.
                </p>
              </div>
            </div>

            {/* Secure & Private */}
            <div className='card hover:shadow-lg transition-shadow'>
              <div className='text-center'>
                <div className='inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg mb-4'>
                  <Shield className='h-6 w-6 text-purple-600' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                  Secure & Private
                </h3>
                <p className='text-gray-600 dark:text-gray-300'>
                  Your practice data is secure with JWT authentication and
                  support for Discord and Google login.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-16 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-4xl mx-auto text-center'>
          <div className='card gradient-primary text-white'>
            <h2 className='text-3xl font-bold mb-4'>
              Ready to Elevate Your Practice?
            </h2>
            <p className='text-xl mb-8 opacity-90'>
              Join musicians worldwide who are improving their skills with
              V1brate's advanced training tools.
            </p>
            {!isAuthenticated && (
              <Link
                to='/register'
                className='inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors'
              >
                Start Your Journey Today
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800'>
        <div className='max-w-7xl mx-auto text-center'>
          <div className='flex items-center justify-center space-x-2 mb-4'>
            <Music className='h-6 w-6 text-primary-600' />
            <span className='text-lg font-semibold text-gray-900 dark:text-white'>
              V1brate
            </span>
          </div>
          <p className='text-gray-600 dark:text-gray-300'>
            © 2025 V1brate. Advanced music training for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
}
