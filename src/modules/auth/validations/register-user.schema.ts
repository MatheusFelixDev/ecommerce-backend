import { z } from 'zod';

export const registerUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must contain at least 2 characters.')
    .max(120, 'Name must contain at most 120 characters.'),

  email: z
    .string()
    .trim()
    .email('Invalid email address.')
    .max(255, 'Email must contain at most 255 characters.')
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(8, 'Password must contain at least 8 characters.')
    .max(72, 'Password must contain at most 72 characters.'),
}).strict();
