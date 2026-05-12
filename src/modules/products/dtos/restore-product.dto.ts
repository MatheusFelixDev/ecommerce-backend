import { z } from 'zod';

export const restoreProductParamsSchema = z.object({
  id: z.string().uuid(),
});

export type RestoreProductParamsDto = z.infer<
  typeof restoreProductParamsSchema
>;
