import { logger } from '../../config/logger';
import { ConnectionManager } from '../connection-manager';

export class ServiceCallHandler {
  constructor(private connectionManager: ConnectionManager) {
    logger.debug('ServiceCallHandler initialized');
  }

  async handleServiceCall(_sourceMemberId: string, _payload: any): Promise<void> {
    // TODO: Implement service call routing
    logger.warn('Service call handling not yet implemented');
  }
}
