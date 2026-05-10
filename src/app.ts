import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastify, { type FastifyInstance } from 'fastify';

import { loggerConfig } from './config/logger';
import { errorHandler } from './core/middlewares/error-handler';
import { registerRoutes } from './modules/routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: loggerConfig,
  });

  await app.register(cors, {
    origin: true,
  });

  await app.register(helmet);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  app.setErrorHandler(errorHandler);

  app.get('/', async () => {
    return {
      success: true,
      data: {
        name: 'ecommerce-backend-api',
        status: 'running',
      },
    };
  });

  await app.register(registerRoutes, {
    prefix: '/api',
  });

  return app;
}
