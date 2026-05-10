import type { FastifyReply, FastifyRequest } from 'fastify';

export async function adminCheckController(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  reply.status(200).send({
    success: true,
    data: {
      message: 'Admin access granted.',
    },
  });
}
