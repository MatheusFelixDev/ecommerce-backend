import type { FastifyReply, FastifyRequest } from 'fastify';

import { createAddressSchema } from '../dtos/create-address.dto';
import { createAddressService } from '../services/create-address.service';

export async function createAddressController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = createAddressSchema.parse(request.body);

  const address = await createAddressService.execute(
    request.user.sub,
    body,
  );

  reply.status(201).send({
    success: true,
    data: {
      address,
    },
  });
}
