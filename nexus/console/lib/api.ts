/**
 * API utility for Nexus Console
 * Handles communication with Nexus Server
 */

import type { Realm, Member } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_NEXUS_API_URL || 'http://localhost:3000/api';

/**
 * Get authentication headers
 * Uses console API key for authentication
 */
function getAuthHeaders(): Record<string, string> {
  // For now, use the console API key directly
  // In production, this should be handled by a backend proxy or middleware
  const consoleApiKey = process.env.NEXT_PUBLIC_CONSOLE_API_KEY || 'nexus-console-key-change-in-production';

  return {
    'Content-Type': 'application/json',
    'Authorization': consoleApiKey,
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
    parentId?: string | null;
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
