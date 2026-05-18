import type { GetSalesReportQuery } from '../dtos/get-sales-report.dto';
import { adminReportsRepository } from '../repositories/admin-reports.repository';

function parseStartDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function parseExclusiveEndDate(date: string): Date {
  const endDate = new Date(`${date}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);

  return endDate;
}

export class GetSalesReportService {
  async execute(query: GetSalesReportQuery) {
    const startDate = parseStartDate(query.startDate);
    const endDate = parseExclusiveEndDate(query.endDate);

    const report = await adminReportsRepository.getSalesReport({
      startDate,
      endDate,
    });

    return {
      period: {
        startDate: query.startDate,
        endDate: query.endDate,
      },
      ...report,
    };
  }
}

export const getSalesReportService =
  new GetSalesReportService();
