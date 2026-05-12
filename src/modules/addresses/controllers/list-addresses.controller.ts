import type { FastifyReply, FastifyRequest } from 'fastify';

import { listAddressesService } from '../services/list-addresses.service';

export async function listAddressesController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const addresses = await listAddressesService.execute(
    request.user.sub,
  );

  reply.status(200).send({
    success: true,
    data: {
      addresses,
    },
  });
}
