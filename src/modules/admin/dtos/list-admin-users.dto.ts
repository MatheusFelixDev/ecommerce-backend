import { z } from 'zod';

export const listAdminUsersQuerySchema = z.object({
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

  search: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .optional(),

  role: z
    .enum(['CUSTOMER', 'ADMIN'])
    .optional(),

  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === 'true',
    ),
});

export type ListAdminUsersQuery = z.infer<
  typeof listAdminUsersQuerySchema
>;
