import { z } from 'zod';

export const updateUserPasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export type UpdateUserPasswordDto = z.infer<
  typeof updateUserPasswordSchema
>;
