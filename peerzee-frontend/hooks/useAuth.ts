'use client';

import { useState, useEffect } from 'react';

/**
 * Simple auth hook that reads token and userId from localStorage
 */
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token'));
      setUserId(localStorage.getItem('userId'));
      setIsLoading(false);
    }
  }, []);

  const isAuthenticated = !!token;

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUserId(null);
  };

  return {
    token,
    userId,
    isAuthenticated,
    isLoading,
    logout,
  };
}
