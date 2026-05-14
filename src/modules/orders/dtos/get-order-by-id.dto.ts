import { z } from 'zod';

export const getOrderByIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type GetOrderByIdParams = z.infer<
  typeof getOrderByIdParamsSchema
>;
