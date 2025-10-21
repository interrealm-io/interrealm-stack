import { logger } from '../../config/logger';
import { AuthProvider } from '../auth-provider.interface';

export class MtlsProvider implements AuthProvider {
  constructor() {
    logger.debug('MtlsProvider initialized');
  }

  // TODO: Implement mTLS authentication
  async authenticate(credentials: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async validate(token: any): Promise<any> {
    throw new Error('Not implemented yet');
  }
}
