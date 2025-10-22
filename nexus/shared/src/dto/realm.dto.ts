/**
 * Data Transfer Objects (DTOs) for Realm API
 */

import { z } from 'zod';
import {
  MemberSchema,
  RouteSchema,
  BridgeSchema,
  RealmTypeSchema,
} from '../schemas/realm.schemas';

/**
 * Create Realm DTO
 * Used for POST /api/realms
 */
export const CreateRealmDTOSchema = z.object({
  realmId: z.string().min(1).max(100).regex(/^[a-z0-9-\/]+$/),
  displayName: z.string().min(1).max(200).optional(),
  realmType: RealmTypeSchema.default('service'),
  description: z.string().max(1000).optional(),
  contractName: z.string().optional(),
  contractVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  policies: z.array(z.string()).default([]),
  inheritPolicies: z.boolean().default(true),
  members: z.array(MemberSchema).default([]),
  routes: z.array(RouteSchema).default([]),
  bridges: z.array(BridgeSchema).default([]),
  metadata: z.record(z.unknown()).optional(),
  parentRealmId: z.string().nullish(), // Optional parent realm ID for hierarchy (accepts null or undefined)
});

export type CreateRealmDTO = z.infer<typeof CreateRealmDTOSchema>;

/**
 * Update Realm DTO
 * Used for PUT /api/realms/:id
 */
export const UpdateRealmDTOSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  contractName: z.string().optional(),
  contractVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  policies: z.array(z.string()).optional(),
  inheritPolicies: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateRealmDTO = z.infer<typeof UpdateRealmDTOSchema>;

/**
 * Realm Response DTO
 * Used for all GET responses
 * Note: Can't use .extend() on lazy schemas, so we define explicitly
 */
export const RealmResponseDTOSchema: z.ZodType<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  parentRealmId: string | null;
  realmId: string;
  displayName?: string;
  realmType?: 'root' | 'service' | 'tenant' | 'environment' | 'department';
  description?: string;
  contractName?: string;
  contractVersion?: string;
  policies?: string[];
  inheritPolicies?: boolean;
  members?: z.infer<typeof MemberSchema>[];
  routes?: z.infer<typeof RouteSchema>[];
  bridges?: z.infer<typeof BridgeSchema>[];
  children?: any[];
  metadata?: Record<string, unknown>;
}> = z.lazy(() =>
  z.object({
    id: z.string().uuid(), // Database ID
    createdAt: z.date(),
    updatedAt: z.date(),
    parentRealmId: z.string().uuid().nullable(),
    realmId: z.string(),
    displayName: z.string().optional(),
    realmType: RealmTypeSchema.optional(),
    description: z.string().optional(),
    contractName: z.string().optional(),
    contractVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
    policies: z.array(z.string()).optional(),
    inheritPolicies: z.boolean().optional(),
    members: z.array(MemberSchema).optional(),
    routes: z.array(RouteSchema).optional(),
    bridges: z.array(BridgeSchema).optional(),
    children: z.array(RealmResponseDTOSchema).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
);

export type RealmResponseDTO = z.infer<typeof RealmResponseDTOSchema>;

/**
 * Realm List Response DTO
 */
export const RealmListResponseDTOSchema = z.object({
  realms: z.array(RealmResponseDTOSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
});

export type RealmListResponseDTO = z.infer<typeof RealmListResponseDTOSchema>;

/**
 * Add Member to Realm DTO
 * Used for POST /api/realms/:id/members
 */
export const AddMemberToRealmDTOSchema = MemberSchema;

export type AddMemberToRealmDTO = z.infer<typeof AddMemberToRealmDTOSchema>;

/**
 * Add Route to Realm DTO
 * Used for POST /api/realms/:id/routes
 */
export const AddRouteToRealmDTOSchema = RouteSchema;

export type AddRouteToRealmDTO = z.infer<typeof AddRouteToRealmDTOSchema>;

/**
 * Add Bridge to Realm DTO
 * Used for POST /api/realms/:id/bridges
 */
export const AddBridgeToRealmDTOSchema = BridgeSchema;

export type AddBridgeToRealmDTO = z.infer<typeof AddBridgeToRealmDTOSchema>;

/**
 * Query Parameters for List Realms
 */
export const ListRealmsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  realmType: RealmTypeSchema.optional(),
  parentRealmId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
});

export type ListRealmsQuery = z.infer<typeof ListRealmsQuerySchema>;
