import { z } from 'zod';

export const getSalesReportQuerySchema = z
  .object({
    startDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/),

    endDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'Start date must be before or equal to end date.',
    path: ['startDate'],
  });

export type GetSalesReportQuery = z.infer<
  typeof getSalesReportQuerySchema
>;
