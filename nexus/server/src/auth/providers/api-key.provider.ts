import { logger } from '../../config/logger';
import { AuthProvider } from '../auth-provider.interface';
import { config } from '../../config/environment';

export class ApiKeyProvider implements AuthProvider {
  private validApiKey: string;

  constructor() {
    this.validApiKey = config.auth.consoleApiKey;
    logger.debug('ApiKeyProvider initialized');
  }

  /**
   * Validate an API key
   * @param credentials Object containing the apiKey to validate
   * @returns true if valid, throws error if invalid
   */
  async authenticate(credentials: { apiKey: string }): Promise<boolean> {
    try {
      if (!credentials || !credentials.apiKey) {
        throw new Error('API key is required');
      }

      const isValid = credentials.apiKey === this.validApiKey;

      if (!isValid) {
        logger.warn('Invalid API key attempt');
        throw new Error('Invalid API key');
      }

      logger.info('API key validated successfully');
      return true;
    } catch (error) {
      logger.error('API key validation failed', error);
      throw error;
    }
  }

  /**
   * Validate an API key (same as authenticate for static keys)
   */
  async validate(apiKey: string): Promise<boolean> {
    return this.authenticate({ apiKey });
  }

  async revoke(token: any): Promise<void> {
    // Static API keys cannot be revoked dynamically
    logger.warn('API key revocation not supported for static keys');
    throw new Error('API key revocation not supported');
  }
}
