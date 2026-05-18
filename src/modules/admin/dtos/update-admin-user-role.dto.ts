import { z } from 'zod';

export const updateAdminUserRoleParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateAdminUserRoleBodySchema = z.object({
  role: z.enum(['CUSTOMER', 'ADMIN']),
});

export type UpdateAdminUserRoleParams = z.infer<
  typeof updateAdminUserRoleParamsSchema
>;

export type UpdateAdminUserRoleBody = z.infer<
  typeof updateAdminUserRoleBodySchema
>;
