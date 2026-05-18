import type { FastifyReply, FastifyRequest } from 'fastify';

import { getSalesReportQuerySchema } from '../dtos/get-sales-report.dto';
import { getSalesReportService } from '../services/get-sales-report.service';

export async function getSalesReportController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const query = getSalesReportQuerySchema.parse(request.query);

  const report = await getSalesReportService.execute(query);

  return reply.status(200).send({
    success: true,
    data: report,
  });
}
