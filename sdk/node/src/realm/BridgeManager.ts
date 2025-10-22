import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { Realm } from './Realm';
import { ServiceMetadata } from '../decorators/Service';
import { AgentMetadata } from '../decorators/Agent';
import { RecruitmentContext, ExecutionContext } from '../agent/LoopParticipant';
import { AuthClient } from '../auth/AuthClient';
import { CapabilityManifestBuilder, CapabilityManifest } from './CapabilityManifest';

interface ServiceHandler {
  metadata: ServiceMetadata;
  handler: (input: any) => Promise<any>;
}

interface AgentHandler {
  metadata: AgentMetadata;
  handler: {
    onRecruitment: (context: RecruitmentContext) => Promise<boolean>;
    execute: (input: any, context: ExecutionContext) => Promise<any>;
    onComplete: (result: any, context: ExecutionContext) => Promise<void>;
  };
}

export class BridgeManager extends EventEmitter {
  private ws?: WebSocket;
  private authClient?: AuthClient;
  private jwtToken?: string;
  private serviceHandlers: Map<string, ServiceHandler> = new Map();
  private agentHandlers: Map<string, AgentHandler> = new Map();
  private pendingRequests: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map();
  private capabilityManifest?: CapabilityManifest;
  private isAuthenticated = false;
  private handshakeComplete = false;
  private handshakeResolver?: { resolve: Function; reject: Function };
  private keepAliveInterval?: NodeJS.Timeout;
  private lastPongReceived: number = Date.now();
  private connectionTimeoutHandle?: NodeJS.Timeout;

  constructor(private realm: Realm) {
    super();
  }

  /**
   * Connect to the Nexus gateway with JWT authentication
   * Phase 1: Authenticate via REST and get JWT token
   * Phase 2: Connect to WebSocket gateway with JWT
   * Phase 3: Send member handshake with capability manifest
   */
  async connect(): Promise<void> {
    const config = this.realm.getConfig();

    // Phase 1: Authenticate via REST and get JWT token
    console.log('Phase 1: Authenticating with Nexus server...');
    this.authClient = new AuthClient({
      serverUrl: config.serverUrl,
      apiKey: config.apiKey,
      timeout: config.authTimeout || 10000,
    });

    try {
      this.jwtToken = await this.authClient.authenticate();
      this.isAuthenticated = true;
      console.log('✓ Authentication successful');
    } catch (error: any) {
      console.error('✗ Authentication failed:', error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }

    // Phase 2: Build capability manifest from registries
    console.log('Phase 2: Building capability manifest...');
    const manifestBuilder = new CapabilityManifestBuilder(
      this.realm.getServiceRegistry(),
      this.realm.getAgentRegistry()
    );
    this.capabilityManifest = manifestBuilder.build();
    console.log('✓ Capability manifest built');
    console.log(CapabilityManifestBuilder.summarize(this.capabilityManifest));

    // Phase 3: Connect to WebSocket gateway with JWT and wait for handshake
    return new Promise((resolve, reject) => {
      console.log('Phase 3: Connecting to gateway...');

      // Store resolver for handshake completion
      this.handshakeResolver = { resolve, reject };

      // Add JWT token as query parameter for WebSocket authentication
      const gatewayUrlWithAuth = `${config.gatewayUrl}?token=${this.jwtToken}`;

      // Disable perMessageDeflate and all extensions to avoid RSV1 issues
      // CRITICAL: Do not request any extensions to prevent RSV1 errors
      this.ws = new WebSocket(gatewayUrlWithAuth, {
        perMessageDeflate: false,
        maxPayload: 100 * 1024 * 1024 // 100MB
      });

      this.connectionTimeoutHandle = setTimeout(() => {
        this.handshakeResolver = undefined;
        reject(new Error('WebSocket connection and handshake timeout'));
        this.ws?.close();
      }, config.connectionTimeout || 15000);

      this.ws.on('open', () => {
        console.log('✓ Connected to gateway');
        console.log('WebSocket client extensions:', (this.ws as any).extensions);
        console.log('WebSocket client compression enabled:', (this.ws as any)._isServer ? 'server' : 'client');

        // Advanced RSV1 protection: Force disable compression internals
        // Override _receiver to validate frames don't have RSV1 bit set
        const receiver = (this.ws as any)._receiver;
        if (receiver) {
          const originalOnData = receiver.onData;
          receiver.onData = function(data: Buffer) {
            // Check if RSV1 bit is set in the frame (bit 6 of first byte)
            if (data.length > 0 && (data[0] & 0x40) !== 0) {
              console.error('Blocked frame with RSV1 bit set (compressed frame)');
              return;
            }
            return originalOnData.call(this, data);
          };
        }

        // Override send to force compression off
        const originalSend = this.ws!.send.bind(this.ws);
        this.ws!.send = function(data: any, options?: any, callback?: any) {
          const safeOptions = {
            ...options,
            compress: false,
            fin: true
          };
          return originalSend(data, safeOptions, callback);
        };

        // Start keep-alive mechanism
        this.startKeepAlive();

        console.log('Sending member handshake...');
        this.sendMemberHandshake();
        // NOTE: Do NOT resolve here - wait for handshake-ack
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data.toString());
      });

      // Handle ping from server
      this.ws.on('ping', () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.pong();
          this.lastPongReceived = Date.now();
        }
      });

      // Handle pong responses from server
      this.ws.on('pong', () => {
        this.lastPongReceived = Date.now();
      });

      this.ws.on('error', (error) => {
        if (this.connectionTimeoutHandle) {
          clearTimeout(this.connectionTimeoutHandle);
          this.connectionTimeoutHandle = undefined;
        }
        console.error('✗ WebSocket error:', error);
        this.isAuthenticated = false;
        this.handshakeComplete = false;
        this.stopKeepAlive();
        if (this.handshakeResolver) {
          this.handshakeResolver.reject(error);
          this.handshakeResolver = undefined;
        }
      });

      this.ws.on('close', () => {
        console.log('Disconnected from gateway');
        this.isAuthenticated = false;
        this.handshakeComplete = false;
        this.stopKeepAlive();
        this.emit('disconnected');
        if (this.handshakeResolver) {
          this.handshakeResolver.reject(new Error('WebSocket closed before handshake completed'));
          this.handshakeResolver = undefined;
        }
      });
    });
  }

  /**
   * Send member handshake with capability manifest
   * This replaces the old realm-based handshake
   */
  private sendMemberHandshake(): void {
    const config = this.realm.getConfig();

    this.send({
      type: 'member-handshake',
      payload: {
        memberId: config.memberId,
        realmId: config.realmId,
        contractName: config.contractName,
        contractVersion: config.contractVersion,
        capabilities: this.capabilityManifest,
        generatedContract: (config as any).generatedContract, // Include the SDK-generated contract
        timestamp: new Date().toISOString(),
      }
    });

    console.log(`Sent member handshake for: ${config.memberId}`);
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'member-handshake-ack':
          this.handleMemberHandshakeAck(message);
          break;
        case 'service-call':
          this.handleServiceCall(message);
          break;
        case 'service-response':
          this.handleServiceResponse(message);
          break;
        case 'loop-recruitment':
          this.handleLoopRecruitment(message);
          break;
        case 'loop-execute':
          this.handleLoopExecute(message);
          break;
        case 'loop-complete':
          this.handleLoopComplete(message);
          break;
        case 'loop-stack-response':
          this.handleLoopStackResponse(message);
          break;
        case 'loop-stack-progress':
          this.handleLoopStackProgress(message);
          break;
        case 'event':
          this.handleEvent(message);
          break;
        case 'error':
          this.handleError(message);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Handle member handshake acknowledgment from gateway
   */
  private handleMemberHandshakeAck(message: any): void {
    const { memberId, status, policies, directory, error } = message.payload;

    if (error) {
      console.error('✗ Member handshake failed:', error);
      this.emit('handshake-failed', { error });

      // Reject the connect promise if handshake fails
      if (this.handshakeResolver) {
        this.handshakeResolver.reject(new Error(`Handshake failed: ${error}`));
        this.handshakeResolver = undefined;
      }
      return;
    }

    console.log('✓ Member handshake acknowledged');
    console.log(`  Status: ${status}`);
    console.log(`  Policies: ${policies?.length || 0} rules`);
    console.log(`  Available services: ${Object.keys(directory?.availableServices || {}).length}`);
    console.log(`  Available capabilities: ${directory?.availableCapabilities?.length || 0}`);

    // Mark handshake as complete
    this.handshakeComplete = true;

    // CRITICAL: Clear connection timeout now that handshake is complete
    if (this.connectionTimeoutHandle) {
      clearTimeout(this.connectionTimeoutHandle);
      this.connectionTimeoutHandle = undefined;
    }

    this.emit('handshake-complete', {
      memberId,
      status,
      policies,
      directory,
    });

    this.emit('ready');

    // NOW resolve the connect promise - connection is fully ready
    if (this.handshakeResolver) {
      this.handshakeResolver.resolve();
      this.handshakeResolver = undefined;
    }
  }

  /**
   * Handle error messages from gateway
   */
  private handleError(message: any): void {
    const { error, code, details } = message.payload;
    console.error(`Gateway error [${code || 'UNKNOWN'}]:`, error);

    this.emit('gateway-error', { error, code, details });
  }

  private async handleServiceCall(message: any): Promise<void> {
    const { requestId, capability, service, input } = message.payload;
    const key = `${capability}.${service}`;

    const handler = this.serviceHandlers.get(key);

    if (!handler) {
      this.send({
        type: 'service-response',
        payload: {
          requestId,
          error: `Service not found: ${key}`
        }
      });
      return;
    }

    try {
      const result = await handler.handler(input);

      this.send({
        type: 'service-response',
        payload: {
          requestId,
          result
        }
      });
    } catch (error: any) {
      this.send({
        type: 'service-response',
        payload: {
          requestId,
          error: error.message
        }
      });
    }
  }

  private handleServiceResponse(message: any): void {
    const { requestId, result, error } = message.payload;

    const pending = this.pendingRequests.get(requestId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(requestId);

    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(result);
    }
  }

  private async handleLoopRecruitment(message: any): Promise<void> {
    const { loopId, loopName, capability, recruitmentMessage, deadline, initiator } = message.payload;

    // Find agents that can participate in this loop
    const candidates = this.realm.getAgentRegistry().findAgentsForLoop(loopName);

    const context: RecruitmentContext = {
      loopId,
      loopName,
      initiator,
      recruitmentMessage,
      deadline: new Date(deadline)
    };

    // Ask each candidate if they want to participate
    const responses = await Promise.all(
      candidates.map(async (agent) => {
        const handler = this.agentHandlers.get(`${agent.metadata.capability}.${agent.metadata.name}`);
        if (!handler) return null;

        try {
          const accepts = await handler.handler.onRecruitment(context);
          return accepts ? {
            agentId: `${agent.metadata.capability}.${agent.metadata.name}`,
            skills: agent.metadata.skills
          } : null;
        } catch (error) {
          console.error(`Agent recruitment error:`, error);
          return null;
        }
      })
    );

    // Send back agents that accepted
    const acceptedAgents = responses.filter(r => r !== null);

    this.send({
      type: 'loop-recruitment-response',
      payload: {
        loopId,
        agents: acceptedAgents
      }
    });
  }

  private async handleLoopExecute(message: any): Promise<void> {
    const { loopId, loopName, agentId, input, otherParticipants } = message.payload;

    const handler = this.agentHandlers.get(agentId);
    if (!handler) {
      this.send({
        type: 'loop-execute-response',
        payload: {
          loopId,
          agentId,
          error: 'Agent not found'
        }
      });
      return;
    }

    const context: ExecutionContext = {
      loopId,
      loopName,
      participantId: agentId,
      otherParticipants
    };

    try {
      const result = await handler.handler.execute(input, context);

      this.send({
        type: 'loop-execute-response',
        payload: {
          loopId,
          agentId,
          result
        }
      });
    } catch (error: any) {
      this.send({
        type: 'loop-execute-response',
        payload: {
          loopId,
          agentId,
          error: error.message
        }
      });
    }
  }

  private async handleLoopComplete(message: any): Promise<void> {
    const { loopId, loopName, result, participants } = message.payload;

    // Notify all participating agents that the loop is complete
    for (const agentId of participants) {
      const handler = this.agentHandlers.get(agentId);
      if (handler && handler.handler.onComplete) {
        const context: ExecutionContext = {
          loopId,
          loopName,
          participantId: agentId,
          otherParticipants: participants.filter((p: string) => p !== agentId)
        };

        try {
          await handler.handler.onComplete(result, context);
        } catch (error) {
          console.error(`Agent onComplete error:`, error);
        }
      }
    }
  }

  private handleLoopStackResponse(message: any): void {
    const { stackId, result, error } = message.payload;

    const pending = this.pendingRequests.get(stackId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(stackId);

    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(result);
    }
  }

  private handleLoopStackProgress(message: any): void {
    const { stackId, stepIndex, stepName, status, result, error } = message.payload;

    // Emit progress event for monitoring
    this.emit('loop-stack-progress', {
      stackId,
      stepIndex,
      stepName,
      status,
      result,
      error
    });

    console.log(`Loop Stack Progress [${stackId}]: Step ${stepIndex} (${stepName}) - ${status}`);
  }

  private handleEvent(message: any): void {
    const { capability, eventName, topic, payload } = message.payload;

    // Emit to event bus
    this.realm.getEventBus().handleIncomingEvent({
      capability,
      eventName,
      topic,
      payload
    });
  }

  async callService(
    capability: string,
    service: string,
    input: any,
    options?: { timeout?: number; retries?: number }
  ): Promise<any> {
    const requestId = this.generateRequestId();
    const timeout = options?.timeout || 30000;

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Service call timeout: ${capability}.${service}`));
      }, timeout);

      this.pendingRequests.set(requestId, { resolve, reject, timeout: timeoutHandle });

      this.send({
        type: 'service-call',
        payload: {
          requestId,
          capability,
          service,
          input
        }
      });
    });
  }

  async initiateLoop(
    capability: string,
    loopName: string,
    input: any,
    options?: {
      recruitmentTimeout?: number;
      executionTimeout?: number;
      minParticipants?: number;
      maxParticipants?: number;
    }
  ): Promise<any> {
    const loopId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      const totalTimeout = (options?.recruitmentTimeout || 5000) + (options?.executionTimeout || 30000);

      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(loopId);
        reject(new Error(`Loop timeout: ${loopName}`));
      }, totalTimeout);

      this.pendingRequests.set(loopId, { resolve, reject, timeout: timeoutHandle });

      this.send({
        type: 'loop-initiate',
        payload: {
          loopId,
          capability,
          loopName,
          input,
          options
        }
      });
    });
  }

  async initiateLoopStack(
    capability: string,
    stackName: string,
    input: any,
    options?: {
      timeout?: number;
      errorStrategy?: 'abort' | 'continue' | 'rollback';
      allowNestedStacks?: boolean;
      maxDepth?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<any> {
    const stackId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      const timeout = options?.timeout || 90000; // 90 seconds default for stack

      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(stackId);
        reject(new Error(`Loop stack timeout: ${stackName}`));
      }, timeout);

      this.pendingRequests.set(stackId, { resolve, reject, timeout: timeoutHandle });

      this.send({
        type: 'loop-stack-initiate',
        payload: {
          stackId,
          capability,
          stackName,
          input,
          options
        }
      });
    });
  }

  registerServiceHandler(metadata: ServiceMetadata, handler: (input: any) => Promise<any>): void {
    const key = `${metadata.capability}.${metadata.name}`;
    this.serviceHandlers.set(key, { metadata, handler });
  }

  registerAgentHandler(
    metadata: AgentMetadata,
    handler: {
      onRecruitment: (context: RecruitmentContext) => Promise<boolean>;
      execute: (input: any, context: ExecutionContext) => Promise<any>;
      onComplete: (result: any, context: ExecutionContext) => Promise<void>;
    }
  ): void {
    const key = `${metadata.capability}.${metadata.name}`;
    this.agentHandlers.set(key, { metadata, handler });
  }

  async publishEvent(capability: string, eventName: string, topic: string, payload: any): Promise<void> {
    this.send({
      type: 'event-publish',
      payload: {
        capability,
        eventName,
        topic,
        payload
      }
    });
  }

  send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    // Allow member-handshake to be sent before handshake completion
    // All other messages should wait until handshake is complete
    if (!this.handshakeComplete && message.type !== 'member-handshake') {
      console.warn(`⚠️  Attempted to send ${message.type} before handshake complete - message blocked`);
      return;
    }

    try {
      // Explicitly disable compression on send to prevent RSV1 errors
      this.ws.send(JSON.stringify(message), { compress: false }, (error) => {
        if (error) {
          console.error('WebSocket send error:', error);
        }
      });
    } catch (error) {
      console.error('WebSocket send exception:', error);
    }
  }

  /**
   * Start keep-alive mechanism to prevent connection timeouts
   * Sends ping every 10 seconds and monitors for pong responses
   */
  private startKeepAlive(): void {
    this.lastPongReceived = Date.now();

    this.keepAliveInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send ping to keep connection alive
        this.ws.ping();

        // Check if we haven't received a pong in 30 seconds
        const timeSinceLastPong = Date.now() - this.lastPongReceived;
        if (timeSinceLastPong > 30000) {
          console.warn('⚠️  No pong received in 30 seconds, connection may be dead');
        }
      }
    }, 10000); // Send ping every 10 seconds
  }

  /**
   * Stop keep-alive mechanism
   */
  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = undefined;
    }
  }

  async disconnect(): Promise<void> {
    this.stopKeepAlive();
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    this.handshakeComplete = false;
    this.handshakeResolver = undefined;
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}