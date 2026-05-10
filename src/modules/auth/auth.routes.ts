import type { FastifyInstance } from 'fastify';

import { loginUserController } from './controllers/login-user.controller';
import { registerUserController } from './controllers/register-user.controller';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/register', registerUserController);
  app.post('/login', loginUserController);
}
