import { z } from 'zod';

export const createCapabilitySchema = z.object({
  realmId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  schema: z.object({
    input: z.record(z.any()).optional(),
    output: z.record(z.any()).optional(),
  }),
  access: z.enum(['public', 'private', 'restricted']),
});

export const updateCapabilitySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  schema: z.object({
    input: z.record(z.any()).optional(),
    output: z.record(z.any()).optional(),
  }).optional(),
  access: z.enum(['public', 'private', 'restricted']).optional(),
});

export const capabilityIdSchema = z.object({
  id: z.string().uuid(),
});
