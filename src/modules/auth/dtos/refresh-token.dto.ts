import type { z } from 'zod';

import { refreshTokenSchema } from '../validations/refresh-token.schema';

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
