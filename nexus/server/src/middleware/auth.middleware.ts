import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { config } from '../config/environment';

export interface AuthRequest extends Request {
  user?: any;
  realmId?: string;
  isConsoleAuth?: boolean;
}

/**
 * Console API Key Authentication Middleware
 * Used by the Nexus Console to manage realms and members
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

    // Support both "Bearer <token>" and "<token>" formats
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    // Check against console API key from env
    const consoleApiKey = process.env.CONSOLE_API_KEY || config.auth.consoleApiKey;

    if (token !== consoleApiKey) {
      logger.warn('Invalid console API key attempt');
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    req.isConsoleAuth = true;
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
