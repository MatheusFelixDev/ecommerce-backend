import type { GetLowStockReportQuery } from '../dtos/get-low-stock-report.dto';
import { adminReportsRepository } from '../repositories/admin-reports.repository';

export class GetLowStockReportService {
  async execute(query: GetLowStockReportQuery) {
    const { products, total } =
      await adminReportsRepository.getLowStockReport({
        threshold: query.threshold,
        page: query.page,
        perPage: query.perPage,
      });

    return {
      threshold: query.threshold,
      products,
      meta: {
        page: query.page,
        perPage: query.perPage,
        total,
        totalPages: Math.ceil(total / query.perPage),
      },
    };
  }
}

export const getLowStockReportService =
  new GetLowStockReportService();
