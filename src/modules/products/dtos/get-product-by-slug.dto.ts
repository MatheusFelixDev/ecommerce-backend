import { z } from 'zod';

export const getProductBySlugParamsSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(180),
});

export type GetProductBySlugParamsDto = z.infer<
  typeof getProductBySlugParamsSchema
>;
