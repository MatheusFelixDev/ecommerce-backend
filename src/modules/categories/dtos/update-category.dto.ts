import { z } from 'zod';

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),

  description: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional(),
}).strict();

export type UpdateCategoryDto = z.infer<
  typeof updateCategorySchema
>;
