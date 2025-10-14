import { logger } from '../config/logger';
import { ApiKeyProvider } from '../auth/providers/api-key.provider';
import { JwtProvider, JwtPayload } from '../auth/providers/jwt.provider';

export class AuthService {
  private apiKeyProvider: ApiKeyProvider;
  private jwtProvider: JwtProvider;

  constructor() {
    this.apiKeyProvider = new ApiKeyProvider();
    this.jwtProvider = new JwtProvider();
    logger.info('AuthService initialized');
  }

  /**
   * Authenticate with API key and return JWT token
   * @param apiKey The API key to validate
   * @returns JWT token if authentication succeeds
   */
  async authenticateWithApiKey(apiKey: string): Promise<string> {
    try {
      // Validate the API key
      await this.apiKeyProvider.authenticate({ apiKey });

      // Generate JWT token for console access
      const jwtToken = await this.jwtProvider.authenticate({
        subject: 'nexus-console',
        type: 'console',
      });

      logger.info('Console authenticated successfully');
      return jwtToken;
    } catch (error) {
      logger.error('Console authentication failed', error);
      throw error;
    }
  }

  /**
   * Validate a JWT token
   * @param token The JWT token to validate
   * @returns Decoded token payload if valid
   */
  async validateJwtToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtProvider.validate(token);
    } catch (error) {
      logger.error('JWT validation failed', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
