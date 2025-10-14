import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { config } from '../config/environment';
import { authService } from '../services/auth.service';

export interface AuthRequest extends Request {
  user?: any;
  realmId?: string;
  isConsoleAuth?: boolean;
}

/**
 * Console JWT Authentication Middleware
 * Used by the Nexus Console to manage realms and members
 * Validates JWT tokens issued to the console
 */
export async function consoleAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    // Require Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('Invalid authorization header format (expected Bearer token)');
      res.status(401).json({ error: 'Invalid authorization header format' });
      return;
    }

    const token = authHeader.substring(7);

    // Validate JWT token
    const payload = await authService.validateJwtToken(token);

    // Ensure this is a console token, not a member token
    if (payload.type !== 'console') {
      logger.warn('Non-console token used for console endpoint');
      res.status(403).json({ error: 'Forbidden: Console access required' });
      return;
    }

    req.isConsoleAuth = true;
    req.user = payload;
    next();
  } catch (error) {
    logger.error('Console auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

/**
 * Standard authentication middleware for SDK clients
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    // TODO: Implement actual member authentication
    // For now, allow through
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}
