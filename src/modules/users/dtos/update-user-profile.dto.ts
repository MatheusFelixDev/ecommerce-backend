import { z } from 'zod';

export const updateUserProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
});

export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>;
