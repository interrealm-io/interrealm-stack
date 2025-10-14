import { logger } from '../config/logger';
import { AuthProvider } from './auth-provider.interface';

export class AuthManager {
  private providers: Map<string, AuthProvider> = new Map();

  constructor() {
    logger.debug('AuthManager initialized');
  }

  // TODO: Implement auth provider management
  registerProvider(name: string, provider: AuthProvider): void {
    this.providers.set(name, provider);
    logger.info(`Auth provider registered: ${name}`);
  }

  async authenticate(providerName: string, credentials: any): Promise<any> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Auth provider not found: ${providerName}`);
    }
    return provider.authenticate(credentials);
  }

  async validate(providerName: string, token: any): Promise<any> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Auth provider not found: ${providerName}`);
    }
    return provider.validate(token);
  }
}
