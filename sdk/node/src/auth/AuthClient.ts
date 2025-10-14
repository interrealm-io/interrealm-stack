import axios, { AxiosInstance } from 'axios';

export interface AuthConfig {
  serverUrl: string;
  apiKey: string;
  timeout?: number;
}

export interface TokenResponse {
  success: boolean;
  token: string;
  expiresIn: string;
  error?: string;
}

export interface TokenPayload {
  subject: string;
  type: string;
  iat: number;
  exp: number;
}

/**
 * AuthClient handles authentication with the Nexus server
 * - Exchanges API key for JWT token via REST
 * - Validates JWT tokens
 * - Manages token lifecycle and refresh
 */
export class AuthClient {
  private httpClient: AxiosInstance;
  private apiKey: string;
  private jwtToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: AuthConfig) {
    this.apiKey = config.apiKey;
    this.httpClient = axios.create({
      baseURL: config.serverUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Exchange API key for JWT token
   * Calls POST /api/auth/token with the API key
   */
  async authenticate(): Promise<string> {
    try {
      console.log('Authenticating with Nexus server...');

      const response = await this.httpClient.post<TokenResponse>('/api/auth/token', {
        apiToken: this.apiKey,
      });

      if (!response.data.success || !response.data.token) {
        throw new Error(response.data.error || 'Authentication failed');
      }

      this.jwtToken = response.data.token;

      // Parse expiry from JWT (format: "24h")
      this.tokenExpiry = Date.now() + this.parseExpiryDuration(response.data.expiresIn);

      console.log('Authentication successful, token expires in:', response.data.expiresIn);

      return this.jwtToken;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Authentication failed: ${error.response.data?.error || error.response.statusText}`);
      }
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Verify if a JWT token is valid
   * Calls POST /api/auth/verify
   */
  async verifyToken(token?: string): Promise<TokenPayload> {
    const tokenToVerify = token || this.jwtToken;

    if (!tokenToVerify) {
      throw new Error('No token available to verify');
    }

    try {
      const response = await this.httpClient.post<{ success: boolean; payload: TokenPayload; error?: string }>(
        '/api/auth/verify',
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenToVerify}`,
          },
        }
      );

      if (!response.data.success || !response.data.payload) {
        throw new Error(response.data.error || 'Token verification failed');
      }

      return response.data.payload;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Token verification failed: ${error.response.data?.error || error.response.statusText}`);
      }
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Get the current JWT token, refreshing if necessary
   */
  async getToken(): Promise<string> {
    // If no token or token is expired/expiring soon (within 5 minutes)
    if (!this.jwtToken || !this.tokenExpiry || this.tokenExpiry - Date.now() < 5 * 60 * 1000) {
      await this.authenticate();
    }

    return this.jwtToken!;
  }

  /**
   * Check if the current token is valid (not expired)
   */
  isTokenValid(): boolean {
    if (!this.jwtToken || !this.tokenExpiry) {
      return false;
    }
    return this.tokenExpiry > Date.now();
  }

  /**
   * Clear the stored token
   */
  clearToken(): void {
    this.jwtToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Parse expiry duration string (e.g., "24h", "1d") to milliseconds
   */
  private parseExpiryDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      // Default to 24 hours if parsing fails
      return 24 * 60 * 60 * 1000;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }
}
