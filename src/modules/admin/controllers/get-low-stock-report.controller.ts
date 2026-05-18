import type { FastifyReply, FastifyRequest } from 'fastify';

import { getLowStockReportQuerySchema } from '../dtos/get-low-stock-report.dto';
import { getLowStockReportService } from '../services/get-low-stock-report.service';

export async function getLowStockReportController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const query = getLowStockReportQuerySchema.parse(request.query);

  const report = await getLowStockReportService.execute(query);

  return reply.status(200).send({
    success: true,
    data: {
      threshold: report.threshold,
      products: report.products,
    },
    meta: report.meta,
  });
}
