import type { z } from 'zod';

import { loginUserSchema } from '../validations/login-user.schema';

export type LoginUserDto = z.infer<typeof loginUserSchema>;
