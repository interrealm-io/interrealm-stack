import { logger } from '../../config/logger';

export class ServiceCallHandler {
  constructor() {
    logger.debug('ServiceCallHandler initialized');
  }

  // TODO: Implement service call message handling
  async handleServiceCall(connection: any, payload: any): Promise<void> {
    throw new Error('Not implemented yet');
  }

  async handleServiceResponse(connection: any, payload: any): Promise<void> {
    throw new Error('Not implemented yet');
  }
}
