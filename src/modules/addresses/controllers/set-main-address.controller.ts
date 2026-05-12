import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { setMainAddressService } from '../services/set-main-address.service';

const setMainAddressParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function setMainAddressController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { id } = setMainAddressParamsSchema.parse(
    request.params,
  );

  const address = await setMainAddressService.execute(
    request.user.sub,
    id,
  );

  reply.status(200).send({
    success: true,
    data: {
      address,
    },
  });
}
