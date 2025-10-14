import { config } from './config/environment';
import { logger } from './config/logger';
import { httpServer, gatewayManager } from './app';

const PORT = config.port || 3000;

async function bootstrap() {
  try {
    httpServer.listen(PORT, () => {
      logger.info(`InterRealm Nexus started on port ${PORT}`);
      logger.info(`WebSocket gateway available at ws://localhost:${PORT}/gateway`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);

      await gatewayManager.stop();

      httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
