import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { deleteAddressService } from '../services/delete-address.service';

const deleteAddressParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteAddressController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { id } = deleteAddressParamsSchema.parse(
    request.params,
  );

  await deleteAddressService.execute(request.user.sub, id);

  reply.status(204).send();
}
