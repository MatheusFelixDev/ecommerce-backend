import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';
import { createAddressController } from './controllers/create-address.controller';
import { deleteAddressController } from './controllers/delete-address.controller';
import { listAddressesController } from './controllers/list-addresses.controller';
import { setMainAddressController } from './controllers/set-main-address.controller';
import { updateAddressController } from './controllers/update-address.controller';

export async function addressesRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post(
    '/',
    {
      preHandler: [authenticate],
    },
    createAddressController,
  );

  app.get(
    '/',
    {
      preHandler: [authenticate],
    },
    listAddressesController,
  );

  app.patch(
    '/:id',
    {
      preHandler: [authenticate],
    },
    updateAddressController,
  );

  app.delete(
    '/:id',
    {
      preHandler: [authenticate],
    },
    deleteAddressController,
  );

  app.patch(
    '/:id/main',
    {
      preHandler: [authenticate],
    },
    setMainAddressController,
  );
}
