import { z } from 'zod';

export const updateAdminUserStatusParamsSchema = z.object({
  id: z.string().uuid(),
}).strict();

export const updateAdminUserStatusBodySchema = z.object({
  isActive: z.boolean(),
}).strict();

export type UpdateAdminUserStatusParams = z.infer<
  typeof updateAdminUserStatusParamsSchema
>;

export type UpdateAdminUserStatusBody = z.infer<
  typeof updateAdminUserStatusBodySchema
>;
