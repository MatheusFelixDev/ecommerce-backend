import type { FastifyReply, FastifyRequest } from 'fastify';

import { getTopProductsReportQuerySchema } from '../dtos/get-top-products-report.dto';
import { getTopProductsReportService } from '../services/get-top-products-report.service';

export async function getTopProductsReportController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const query = getTopProductsReportQuerySchema.parse(request.query);

  const report = await getTopProductsReportService.execute(query);

  return reply.status(200).send({
    success: true,
    data: report,
  });
}
