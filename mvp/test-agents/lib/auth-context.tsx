'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  jwtToken: string | null;
  apiToken: string | null;
  login: (apiToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  jwtToken: null,
  apiToken: null,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [apiToken, setApiToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status on mount
    const storedJwtToken = sessionStorage.getItem('nexusJwtToken');
    const storedApiToken = sessionStorage.getItem('nexusApiToken');
    const authStatus = sessionStorage.getItem('isAuthenticated');

    if (authStatus === 'true' && storedJwtToken && storedApiToken) {
      setIsAuthenticated(true);
      setJwtToken(storedJwtToken);
      setApiToken(storedApiToken);
    }
  }, []);

  const login = async (apiToken: string) => {
    try {
      // Call nexus/server auth endpoint to exchange API token for JWT
      const response = await fetch('http://localhost:3000/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await response.json();

      if (!data.success || !data.token) {
        throw new Error('Invalid response from server');
      }

      const jwt = data.token;

      // Store tokens in session storage
      sessionStorage.setItem('nexusJwtToken', jwt);
      sessionStorage.setItem('nexusApiToken', apiToken);
      sessionStorage.setItem('isAuthenticated', 'true');

      // Update state
      setIsAuthenticated(true);
      setJwtToken(jwt);
      setApiToken(apiToken);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear session storage
    sessionStorage.removeItem('nexusJwtToken');
    sessionStorage.removeItem('nexusApiToken');
    sessionStorage.removeItem('isAuthenticated');

    // Update state
    setIsAuthenticated(false);
    setJwtToken(null);
    setApiToken(null);

    // Redirect to login
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, jwtToken, apiToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
