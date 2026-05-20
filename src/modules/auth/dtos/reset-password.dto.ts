import { z } from 'zod';

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  newPassword: z.string().min(8),
}).strict();

export type ResetPasswordDto = z.infer<
  typeof resetPasswordSchema
>;
