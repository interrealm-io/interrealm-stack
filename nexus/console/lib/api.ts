/**
 * API utility for Nexus Console
 * Handles communication with Nexus Server
 */

import type { Realm, Member } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_NEXUS_API_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_NEXUS_API_URL environment variable is not set');
}

/**
 * Get JWT token from session storage
 * This token was obtained during login via the AuthContext
 */
function getJwtToken(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('API calls must be made from the browser');
  }

  // Get token from session storage (set by AuthContext during login)
  const token = sessionStorage.getItem('nexusJwtToken');

  if (!token) {
    throw new Error('Not authenticated. Please login first.');
  }

  return token;
}

/**
 * Get authentication headers
 * Uses JWT token from session storage (obtained during login)
 */
function getAuthHeaders(): Record<string, string> {
  const token = getJwtToken();

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Realm API
 */
export const realmApi = {
  /**
   * Get all realms
   */
  async getAll(): Promise<Realm[]> {
    const response = await fetch(`${API_BASE_URL}/realms`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch realms');
    }

    const data = await response.json();
    // Server returns { realms, total, page, pageSize }, extract realms array
    return data.realms || data;
  },

  /**
   * Get a specific realm by ID
   */
  async getById(id: string): Promise<Realm> {
    const response = await fetch(`${API_BASE_URL}/realms/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch realm ${id}`);
    }

    return response.json();
  },

  /**
   * Create a new realm
   */
  async create(data: {
    realmId: string;
    displayName: string;
    parentRealmId?: string | null;
    realmType: string;
    policies?: string[];
    inheritPolicies?: boolean;
    metadata?: Record<string, any>;
  }): Promise<Realm> {
    const response = await fetch(`${API_BASE_URL}/realms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      // Format validation errors nicely
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((e: any) =>
          `${e.path?.join('.') || 'Field'}: ${e.message}`
        ).join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(error.message || 'Failed to create realm');
    }

    return response.json();
  },

  /**
   * Update an existing realm
   */
  async update(id: string, data: Partial<Realm>): Promise<Realm> {
    const response = await fetch(`${API_BASE_URL}/realms/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update realm');
    }

    return response.json();
  },

  /**
   * Delete a realm
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/realms/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete realm');
    }
  },
};

/**
 * Member API
 */
export const memberApi = {
  /**
   * Get all members (optionally filtered by realm)
   */
  async getAll(realmId?: string): Promise<Member[]> {
    const url = realmId
      ? `${API_BASE_URL}/members?realmId=${encodeURIComponent(realmId)}`
      : `${API_BASE_URL}/members`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch members');
    }

    const data = await response.json();
    // Server returns { members, total, page, pageSize }, extract members array
    return data.members || data;
  },

  /**
   * Get a specific member by ID
   */
  async getById(id: string): Promise<Member> {
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch member ${id}`);
    }

    return response.json();
  },

  /**
   * Create a new member
   */
  async create(data: {
    name: string;
    realmId: string;
    memberType: string;
    contractName?: string;
    contractVersion?: string;
    metadata?: Record<string, any>;
  }): Promise<Member & { apiKey?: string }> {
    const response = await fetch(`${API_BASE_URL}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create member');
    }

    return response.json();
  },

  /**
   * Update an existing member
   */
  async update(id: string, data: Partial<Member>): Promise<Member> {
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update member');
    }

    return response.json();
  },

  /**
   * Delete a member
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete member');
    }
  },
};
