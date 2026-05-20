import { z } from 'zod';

export const loginUserSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Invalid email address.')
    .max(255, 'Email must contain at most 255 characters.')
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(1, 'Password is required.')
    .max(72, 'Password must contain at most 72 characters.'),
}).strict();
