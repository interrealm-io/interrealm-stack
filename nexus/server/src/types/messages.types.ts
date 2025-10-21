import WebSocket from 'ws';

export interface ExtendedWebSocket extends WebSocket {
  realmId?: string;
  memberId?: string;
  isAlive?: boolean;
}

export interface Message {
  type: MessageType;
  payload: any;
  metadata?: MessageMetadata;
}

export type MessageType =
  | 'register-realm'
  | 'client-handshake'
  | 'service-call'
  | 'service-response'
  | 'loop-initiate'
  | 'loop-recruitment'
  | 'loop-recruitment-response'
  | 'loop-response'
  | 'event-publish'
  | 'event-subscribe'
  | 'event-unsubscribe';

export interface MessageMetadata {
  messageId: string;
  timestamp: string;
  sourceRealmId?: string;
  targetRealmId?: string;
}

export interface RegisterRealmPayload {
  realmId: string;
  name: string;
  capabilities: string[];
  authToken?: string;
}

export interface ClientHandshakePayload {
  clientId: string;
  version: string;
  authToken?: string;
}

export interface ServiceCallPayload {
  requestId: string;
  targetRealmId: string;
  capabilityId: string;
  input: any;
}

export interface ServiceResponsePayload {
  requestId: string;
  success: boolean;
  output?: any;
  error?: string;
}

export interface LoopInitiatePayload {
  loopId: string;
  participants: string[];
  capabilityId: string;
  input: any;
}

export interface LoopRecruitmentPayload {
  loopId: string;
  participantRealmId: string;
  capabilityId: string;
  input: any;
}

export interface LoopRecruitmentResponsePayload {
  loopId: string;
  accepted: boolean;
  reason?: string;
}

export interface LoopResponsePayload {
  loopId: string;
  realmId: string;
  success: boolean;
  output?: any;
  error?: string;
}

export interface EventPublishPayload {
  eventType: string;
  payload: any;
}

export interface EventSubscribePayload {
  eventType: string;
}

export interface PendingRequest {
  requestId: string;
  sourceRealmId: string;
  targetRealmId: string;
  capabilityId: string;
  timestamp: number;
}

export interface LoopState {
  loopId: string;
  initiatorRealmId: string;
  participants: string[];
  responses: Map<string, any>;
  status: 'recruiting' | 'executing' | 'completed' | 'failed';
}
