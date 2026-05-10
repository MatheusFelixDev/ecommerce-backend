import type { z } from 'zod';

import { registerUserSchema } from '../validations/register-user.schema';

export type RegisterUserDto = z.infer<typeof registerUserSchema>;
