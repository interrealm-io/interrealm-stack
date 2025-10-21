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
    console.log('[AuthContext] Checking authentication status on mount');
    // Check authentication status on mount
    const storedJwtToken = sessionStorage.getItem('nexusJwtToken');
    const storedApiToken = sessionStorage.getItem('nexusApiToken');
    const authStatus = sessionStorage.getItem('isAuthenticated');

    console.log('[AuthContext] Stored auth status:', {
      authStatus,
      hasJwt: !!storedJwtToken,
      hasApiToken: !!storedApiToken
    });

    if (authStatus === 'true' && storedJwtToken && storedApiToken) {
      console.log('[AuthContext] Restoring authenticated session');
      setIsAuthenticated(true);
      setJwtToken(storedJwtToken);
      setApiToken(storedApiToken);
    } else {
      console.log('[AuthContext] No valid session found');
    }
  }, []);

  const login = async (apiToken: string) => {
    console.log('[AuthContext] Login attempt starting');
    console.log('[AuthContext] API Token length:', apiToken?.length || 0);

    try {
      // Call the Next.js console API which will proxy to Nexus server
      // This avoids CORS issues and keeps the Nexus server internal
      const authUrl = '/api/auth/token';
      console.log('[AuthContext] Calling auth endpoint:', authUrl);

      // Call nexus/server auth endpoint to exchange API token for JWT
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiToken }),
      });

      console.log('[AuthContext] Response status:', response.status);
      console.log('[AuthContext] Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AuthContext] Auth failed with error:', errorData);
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await response.json();
      console.log('[AuthContext] Auth response data:', {
        success: data.success,
        hasToken: !!data.token
      });

      if (!data.success || !data.token) {
        console.error('[AuthContext] Invalid server response:', data);
        throw new Error('Invalid response from server');
      }

      const jwt = data.token;

      // Store tokens in session storage
      console.log('[AuthContext] Storing tokens in sessionStorage');
      sessionStorage.setItem('nexusJwtToken', jwt);
      sessionStorage.setItem('nexusApiToken', apiToken);
      sessionStorage.setItem('isAuthenticated', 'true');

      // Update state
      console.log('[AuthContext] Updating auth state');
      setIsAuthenticated(true);
      setJwtToken(jwt);
      setApiToken(apiToken);

      // Redirect to dashboard
      console.log('[AuthContext] Redirecting to /dashboard');
      router.push('/dashboard');
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      if (error instanceof Error) {
        console.error('[AuthContext] Error message:', error.message);
        console.error('[AuthContext] Error stack:', error.stack);
      }
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
