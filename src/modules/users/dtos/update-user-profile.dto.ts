import { z } from 'zod';

export const updateUserProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),

  phone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .nullable()
    .optional(),
});

export type UpdateUserProfileDto = z.infer<
  typeof updateUserProfileSchema
>;
