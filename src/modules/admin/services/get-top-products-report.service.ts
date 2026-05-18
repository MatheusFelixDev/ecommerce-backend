import type { GetTopProductsReportQuery } from '../dtos/get-top-products-report.dto';
import { adminReportsRepository } from '../repositories/admin-reports.repository';

function parseStartDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function parseExclusiveEndDate(date: string): Date {
  const endDate = new Date(`${date}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);

  return endDate;
}

export class GetTopProductsReportService {
  async execute(query: GetTopProductsReportQuery) {
    const startDate = parseStartDate(query.startDate);
    const endDate = parseExclusiveEndDate(query.endDate);

    const products =
      await adminReportsRepository.getTopProductsReport({
        startDate,
        endDate,
        limit: query.limit,
      });

    return {
      period: {
        startDate: query.startDate,
        endDate: query.endDate,
      },
      limit: query.limit,
      products,
    };
  }
}

export const getTopProductsReportService =
  new GetTopProductsReportService();
