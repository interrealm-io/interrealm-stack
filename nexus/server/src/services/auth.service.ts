import { logger } from '../config/logger';
import { ApiKeyProvider } from '../auth/providers/api-key.provider';
import { JwtProvider, JwtPayload } from '../auth/providers/jwt.provider';
import { prisma } from '../config/database';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

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
   * This method handles BOTH console API keys AND member API keys
   * @param apiKey The API key to validate
   * @returns JWT token if authentication succeeds
   */
  async authenticateWithApiKey(apiKey: string): Promise<string> {
    try {
      logger.info('=== AUTHENTICATE WITH API KEY ===');
      logger.info(`Received API key: ${apiKey.substring(0, 8)}...`);
      logger.info(`API key length: ${apiKey.length}`);

      // First, check if it's the console API key
      const consoleKey = config.auth.consoleApiKey;
      logger.info(`Console API key from config: ${consoleKey ? `${consoleKey.substring(0, 8)}...` : 'undefined'}`);
      logger.info(`Console API key length: ${consoleKey?.length || 0}`);
      logger.info(`Keys match console: ${apiKey === consoleKey}`);

      if (apiKey === config.auth.consoleApiKey) {
        const jwtToken = await this.jwtProvider.authenticate({
          subject: 'nexus-console',
          type: 'console',
        });
        logger.info('Console authenticated successfully');
        return jwtToken;
      }

      // Otherwise, look up member by API key
      logger.info('Not console key, searching for member...');
      const member = await prisma.member.findFirst({
        where: {
          authType: 'api-key',
          authConfig: {
            path: ['apiKey'],
            equals: apiKey
          }
        },
        include: {
          realm: true
        }
      });

      logger.info(`Member found: ${member ? 'YES' : 'NO'}`);
      if (member) {
        logger.info(`Member ID: ${member.id}`);
        logger.info(`Member authConfig: ${JSON.stringify(member.authConfig)}`);
      }

      if (!member) {
        logger.error('=== API KEY NOT FOUND ===');
        logger.error(`Searched for key: ${apiKey.substring(0, 8)}...`);
        throw new Error('Invalid API key');
      }

      // Generate JWT token with member info
      const jwtToken = jwt.sign(
        {
          memberId: member.id,
          realmId: member.realm.realmId,
          type: 'member'
        },
        config.auth.jwtSecret,
        { expiresIn: config.auth.jwtExpiresIn }
      );

      logger.info(`Member authenticated: ${member.id}`);
      return jwtToken;
    } catch (error) {
      logger.error('Authentication failed', error);
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
