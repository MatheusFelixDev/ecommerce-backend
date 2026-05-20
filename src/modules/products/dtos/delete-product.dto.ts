import { z } from 'zod';

export const deleteProductParamsSchema = z.object({
  id: z.string().uuid(),
}).strict();

export type DeleteProductParamsDto = z.infer<
  typeof deleteProductParamsSchema
>;
