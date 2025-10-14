import { config } from './config/environment';
import { logger } from './config/logger';
import { app } from './app';

const PORT = config.port || 3000;

async function bootstrap() {
  try {
    const server = app.listen(PORT, () => {
      logger.info(`InterRealm Gateway started on port ${PORT}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);

      server.close(() => {
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
