import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { WidgetProvider } from './contexts/WidgetContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AuthCallback from './pages/AuthCallback';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <UserPreferencesProvider>
            <WidgetProvider>
              <Router>
                <div className='min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300'>
                  {/* <Navbar /> */}
                  <main className='pt-16'>
                    <Routes>
                      <Route path='/' element={<LandingPage />} />
                      <Route path='/login' element={<LoginPage />} />
                      <Route path='/register' element={<RegisterPage />} />
                      <Route path='/auth/callback' element={<AuthCallback />} />
                      <Route
                        path='/dashboard'
                        element={
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path='*' element={<NotFoundPage />} />
                    </Routes>
                  </main>
                  <Toaster
                    position='top-right'
                    toastOptions={{
                      duration: 4000,
                      className: 'dark:bg-gray-800 dark:text-white',
                    }}
                  />
                </div>
              </Router>
            </WidgetProvider>
          </UserPreferencesProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
