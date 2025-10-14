import { config } from './config/environment';
import { logger } from './config/logger';
import { httpServer, gatewayManager } from './app';

const PORT = config.port || 3000;

async function bootstrap() {
  try {
    // Handle server startup errors (like EADDRINUSE)
    httpServer.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Kill the process using: lsof -ti:${PORT} | xargs kill -9`);
        process.exit(1);
      } else {
        logger.error('Server error:', error);
        process.exit(1);
      }
    });

    // Bind to 127.0.0.1 instead of 0.0.0.0 to avoid macOS firewall issues
    httpServer.listen(PORT, '127.0.0.1', () => {
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

    // Handle uncaught errors that could leave server running
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
