import { z } from 'zod';

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .trim()
    .min(1, 'Refresh token is required.'),
}).strict();
