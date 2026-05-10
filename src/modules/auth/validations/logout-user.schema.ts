import { z } from 'zod';

export const logoutUserSchema = z.object({
  refreshToken: z
    .string()
    .trim()
    .min(1, 'Refresh token is required.'),
});
