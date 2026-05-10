import type { FastifyInstance } from 'fastify';

import { healthController } from './health.controller';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', healthController);
}
