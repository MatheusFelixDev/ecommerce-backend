import { z } from 'zod';

const createProductImageSchema = z.object({
  url: z.string().trim().url(),

  altText: z
    .string()
    .trim()
    .max(150)
    .optional(),

  position: z
    .number()
    .int()
    .min(0)
    .optional(),

  isMain: z
    .boolean()
    .optional(),
});

export const createProductSchema = z.object({
  categoryId: z.string().uuid(),

  name: z
    .string()
    .trim()
    .min(2)
    .max(150),

  description: z
    .string()
    .trim()
    .max(2000)
    .optional(),

  sku: z
    .string()
    .trim()
    .min(2)
    .max(80),

  priceInCents: z
    .number()
    .int()
    .positive(),

  discountInCents: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),

  stock: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),

  status: z
    .enum(['DRAFT', 'ACTIVE', 'INACTIVE'])
    .optional()
    .default('ACTIVE'),

  images: z
    .array(createProductImageSchema)
    .max(10)
    .optional()
    .default([]),
});

export type CreateProductDto = z.infer<
  typeof createProductSchema
>;
