import { z } from 'zod';

export const getAdminUserByIdParamsSchema = z.object({
  id: z.string().uuid(),
}).strict();

export type GetAdminUserByIdParams = z.infer<
  typeof getAdminUserByIdParamsSchema
>;
