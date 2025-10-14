import jwt from 'jsonwebtoken';
import { logger } from '../../config/logger';
import { AuthProvider } from '../auth-provider.interface';
import { config } from '../../config/environment';

export interface JwtPayload {
  sub: string;
  type: string;
  iat?: number;
  exp?: number;
}

export class JwtProvider implements AuthProvider {
  private secret: string;
  private expiresIn: string;

  constructor() {
    this.secret = config.auth.jwtSecret;
    this.expiresIn = config.auth.jwtExpiresIn;
    logger.debug('JwtProvider initialized');
  }

  /**
   * Generate a JWT token for the given subject
   */
  async authenticate(credentials: { subject: string; type: string }): Promise<string> {
    try {
      const payload: JwtPayload = {
        sub: credentials.subject,
        type: credentials.type,
      };

      const token = jwt.sign(payload, this.secret, {
        expiresIn: this.expiresIn as string | number,
      });

      logger.debug(`JWT token generated for ${credentials.subject}`);
      return token;
    } catch (error) {
      logger.error('JWT generation failed', error);
      throw new Error('Failed to generate JWT token');
    }
  }

  /**
   * Validate and decode a JWT token
   */
  async validate(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, this.secret) as JwtPayload;
      logger.debug(`JWT token validated for ${decoded.sub}`);
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('JWT token expired');
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid JWT token');
        throw new Error('Invalid token');
      }
      logger.error('JWT validation failed', error);
      throw new Error('Token validation failed');
    }
  }

  async revoke(token: any): Promise<void> {
    // JWT tokens are stateless and cannot be revoked without a blacklist
    // This would require implementing a token blacklist in the database
    logger.warn('JWT revocation not implemented - tokens expire naturally');
    throw new Error('JWT revocation not implemented');
  }
}
