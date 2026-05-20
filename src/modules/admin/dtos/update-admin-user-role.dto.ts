import { z } from 'zod';

export const updateAdminUserRoleParamsSchema = z.object({
  id: z.string().uuid(),
}).strict();

export const updateAdminUserRoleBodySchema = z.object({
  role: z.enum(['CUSTOMER', 'ADMIN']),
}).strict();

export type UpdateAdminUserRoleParams = z.infer<
  typeof updateAdminUserRoleParamsSchema
>;

export type UpdateAdminUserRoleBody = z.infer<
  typeof updateAdminUserRoleBodySchema
>;
