import { z } from 'zod';

export const requestEmailChangeSchema = z.object({
  newEmail: z.string().email().trim().toLowerCase(),
  currentPassword: z.string().min(8),
});

export type RequestEmailChangeDto = z.infer<
  typeof requestEmailChangeSchema
>;
