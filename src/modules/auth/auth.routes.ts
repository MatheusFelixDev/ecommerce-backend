import type { FastifyInstance } from 'fastify';

import { registerUserController } from './controllers/register-user.controller';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/register', registerUserController);
}
