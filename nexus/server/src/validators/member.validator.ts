import { z } from 'zod';

export const createMemberSchema = z.object({
  realmId: z.string().uuid(),
  name: z.string().min(1).max(255),
  roles: z.array(z.string()).optional(),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  roles: z.array(z.string()).optional(),
});

export const memberIdSchema = z.object({
  id: z.string().uuid(),
});
