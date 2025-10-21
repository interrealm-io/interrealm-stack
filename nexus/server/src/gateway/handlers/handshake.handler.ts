import { logger } from '../../config/logger';
import { ConnectionManager } from '../connection-manager';

interface HandshakePayload {
  memberId: string;
  realmId: string;
  contractName?: string;
  contractVersion?: string;
  capabilities?: {
    provides: {
      services: any[];
      agents: any[];
      events: any[];
    };
    requires: {
      services: string[];
      events: string[];
    };
  };
  timestamp: string;
}

export class HandshakeHandler {
  constructor(private connectionManager: ConnectionManager) {
    logger.debug('HandshakeHandler initialized');
  }

  async handleClientHandshake(memberId: string, payload: HandshakePayload): Promise<void> {
    logger.info(`Processing handshake from member: ${memberId}`);
    logger.debug('Handshake payload:', JSON.stringify(payload, null, 2));

    // Update connection metadata with capabilities
    const connection = this.connectionManager.getConnection(memberId);
    if (connection && connection.metadata) {
      connection.metadata.contractName = payload.contractName;
      connection.metadata.contractVersion = payload.contractVersion;
      connection.metadata.capabilities = payload.capabilities;
    }

    // Log capability summary
    if (payload.capabilities) {
      const { provides } = payload.capabilities;
      logger.info(`Member ${memberId} capabilities:`);
      logger.info(`  Services: ${provides.services.length}`);
      provides.services.forEach(s => {
        logger.info(`    - ${s.capability}.${s.name}`);
      });
      logger.info(`  Agents: ${provides.agents.length}`);
      provides.agents.forEach(a => {
        logger.info(`    - ${a.capability}.${a.name}`);
      });
      logger.info(`  Events: ${provides.events.length}`);
      provides.events.forEach(e => {
        logger.info(`    - ${e.capability}.${e.name}`);
      });
    }

    // Send acknowledgment
    this.connectionManager.send(memberId, {
      type: 'member-handshake-ack',
      payload: {
        memberId,
        status: 'connected',
        policies: [],
        directory: {
          availableServices: {},
          availableCapabilities: []
        },
        timestamp: new Date().toISOString()
      }
    });

    logger.info(`Handshake complete for member: ${memberId}`);
  }
}
