'use client';

import React, { useState, useEffect } from 'react';
import { getFromStorage, setToStorage } from '@/lib/utils';

interface PasswordGateProps {
  children: React.ReactNode;
}

const AUTH_KEY = 'laaa_auth';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Default password - in production, use environment variable
const TEAM_PASSWORD = process.env.NEXT_PUBLIC_TEAM_PASSWORD || 'laaa2025';

export function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user has a valid session - hydration from localStorage
    const session = getFromStorage<{ expiry: number } | null>(AUTH_KEY, null);
    if (session && session.expiry > Date.now()) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate a slight delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (password === TEAM_PASSWORD) {
      const session = { expiry: Date.now() + SESSION_DURATION };
      setToStorage(AUTH_KEY, session);
      setIsAuthenticated(true);
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    setToStorage(AUTH_KEY, null);
    setIsAuthenticated(false);
    setPassword('');
  };

  // Still checking authentication status
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  // Not authenticated - show login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Land Residual Analysis
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                LAAA Team Internal Tool
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Team Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter team password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  autoFocus
                  required
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLoading ? 'Verifying...' : 'Access Dashboard'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
              Contact your administrator if you need access credentials.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - render children with logout option available via context
  return (
    <AuthContext.Provider value={{ logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Context for logout functionality
interface AuthContextType {
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within PasswordGate');
  }
  return context;
}

// Logout button component
export function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
    >
      Logout
    </button>
  );
}
