/**
 * Data Transfer Objects (DTOs) for Member API
 */

import { z } from 'zod';
import {
  MemberTypeSchema,
  AuthTypeSchema,
  MemberStatusSchema,
} from '../schemas/realm.schemas';

/**
 * Create Member DTO
 * Used for POST /api/members
 */
export const CreateMemberDTOSchema = z.object({
  name: z.string().min(1).max(200),
  realmId: z.string().uuid(),
  memberType: MemberTypeSchema.default('consumer'),
  contractName: z.string().optional(),
  contractVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateMemberDTO = z.infer<typeof CreateMemberDTOSchema>;

/**
 * Update Member DTO
 * Used for PUT /api/members/:id
 */
export const UpdateMemberDTOSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  contractName: z.string().optional(),
  contractVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  status: MemberStatusSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateMemberDTO = z.infer<typeof UpdateMemberDTOSchema>;

/**
 * Member Response DTO
 * Used for all GET responses
 */
export const MemberResponseDTOSchema = z.object({
  id: z.string().min(1).max(255),
  name: z.string(),
  realmId: z.string().uuid(),
  memberType: MemberTypeSchema,
  contractName: z.string().optional().nullable(),
  contractVersion: z.string().optional().nullable(),
  authType: AuthTypeSchema,
  authConfig: z.record(z.unknown()),
  status: MemberStatusSchema,
  lastConnected: z.date().optional().nullable(),
  metadata: z.record(z.unknown()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MemberResponseDTO = z.infer<typeof MemberResponseDTOSchema>;

/**
 * Member List Response DTO
 */
export const MemberListResponseDTOSchema = z.object({
  members: z.array(MemberResponseDTOSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
});

export type MemberListResponseDTO = z.infer<typeof MemberListResponseDTOSchema>;

/**
 * Query Parameters for List Members
 */
export const ListMembersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  realmId: z.string().uuid().optional(),
  memberType: MemberTypeSchema.optional(),
  status: MemberStatusSchema.optional(),
  search: z.string().max(200).optional(),
});

export type ListMembersQuery = z.infer<typeof ListMembersQuerySchema>;

/**
 * Create Member Response - includes generated API key
 */
export const CreateMemberResponseDTOSchema = MemberResponseDTOSchema.extend({
  apiKey: z.string().optional(),
});

export type CreateMemberResponseDTO = z.infer<typeof CreateMemberResponseDTOSchema>;
