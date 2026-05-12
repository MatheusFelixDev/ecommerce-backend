import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { updateAddressSchema } from '../dtos/update-address.dto';
import { updateAddressService } from '../services/update-address.service';

const updateAddressParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function updateAddressController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { id } = updateAddressParamsSchema.parse(
    request.params,
  );

  const body = updateAddressSchema.parse(request.body);

  const address = await updateAddressService.execute(
    request.user.sub,
    id,
    body,
  );

  reply.status(200).send({
    success: true,
    data: {
      address,
    },
  });
}
