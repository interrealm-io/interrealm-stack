import { z } from 'zod';

export const createRealmSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  capabilities: z.array(z.string()).optional(),
});

export const updateRealmSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  capabilities: z.array(z.string()).optional(),
});

export const realmIdSchema = z.object({
  id: z.string().uuid(),
});
