import { logger } from '../../config/logger';

export class GrpcProtocol {
  constructor() {
    logger.debug('GrpcProtocol initialized');
  }

  // TODO: Implement gRPC protocol adapter
  async initialize(): Promise<void> {
    throw new Error('Not implemented yet');
  }

  async send(connection: any, message: any): Promise<void> {
    throw new Error('Not implemented yet');
  }

  async close(connection: any): Promise<void> {
    throw new Error('Not implemented yet');
  }
}
