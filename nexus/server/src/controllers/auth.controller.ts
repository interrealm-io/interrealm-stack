import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /api/auth/token
 * Exchange API key for JWT token
 */
router.post('/token', async (req: Request, res: Response) => {
  try {
    const { apiToken } = req.body;

    logger.info('=== AUTH TOKEN REQUEST ===');
    logger.info(`Received API token: ${apiToken ? `${apiToken.substring(0, 8)}...` : 'undefined'}`);
    logger.info(`Token length: ${apiToken?.length || 0}`);
    logger.info(`Request body keys: ${JSON.stringify(Object.keys(req.body))}`);

    if (!apiToken) {
      return res.status(400).json({
        success: false,
        error: 'API token is required',
      });
    }

    // Authenticate with API key and get JWT token
    const jwtToken = await authService.authenticateWithApiKey(apiToken);

    return res.status(200).json({
      success: true,
      token: jwtToken,
      expiresIn: '24h',
    });
  } catch (error) {
    logger.error('Token exchange failed', error);

    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify a JWT token
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = await authService.validateJwtToken(token);

    return res.status(200).json({
      success: true,
      payload,
    });
  } catch (error) {
    logger.error('Token verification failed', error);

    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
});

export default router;
