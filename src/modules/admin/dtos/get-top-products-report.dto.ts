import { z } from 'zod';

export const getTopProductsReportQuerySchema = z
  .object({
    startDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/),

    endDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/),

    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(50)
      .optional()
      .default(10),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'Start date must be before or equal to end date.',
    path: ['startDate'],
  });

export type GetTopProductsReportQuery = z.infer<
  typeof getTopProductsReportQuerySchema
>;
