import { z } from 'zod';

export const cancelOrderParamsSchema = z.object({
  id: z.string().uuid(),
}).strict();

export type CancelOrderParams = z.infer<
  typeof cancelOrderParamsSchema
>;
