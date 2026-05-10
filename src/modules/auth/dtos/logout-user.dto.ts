import type { z } from 'zod';

import { logoutUserSchema } from '../validations/logout-user.schema';

export type LogoutUserDto = z.infer<typeof logoutUserSchema>;
