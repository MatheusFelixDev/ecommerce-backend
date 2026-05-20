import { z } from 'zod';

export const getLowStockReportQuerySchema = z.object({
  threshold: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .default(5),

  page: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(1),

  perPage: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .default(10),
}).strict();

export type GetLowStockReportQuery = z.infer<
  typeof getLowStockReportQuerySchema
>;
