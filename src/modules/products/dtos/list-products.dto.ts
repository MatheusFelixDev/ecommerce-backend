import { z } from 'zod';

export const listProductsSchema = z.object({
  page: z
    .coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(1),

  perPage: z
    .coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(10),

  search: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .optional(),

  categoryId: z
    .string()
    .uuid()
    .optional(),

  categorySlug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .optional(),

  minPriceInCents: z
    .coerce
    .number()
    .int()
    .min(0)
    .optional(),

  maxPriceInCents: z
    .coerce
    .number()
    .int()
    .min(0)
    .optional(),

  inStock: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value === 'true';
    }),

  sortBy: z
    .enum(['recent', 'price', 'best_selling'])
    .optional()
    .default('recent'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

export type ListProductsDto = z.infer<
  typeof listProductsSchema
>;
