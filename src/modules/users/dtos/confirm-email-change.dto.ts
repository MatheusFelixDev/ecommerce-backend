import { z } from 'zod';

export const confirmEmailChangeSchema = z.object({
  token: z.string().min(32),
}).strict();

export type ConfirmEmailChangeDto = z.infer<
  typeof confirmEmailChangeSchema
>;
