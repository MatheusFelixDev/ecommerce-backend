import { z } from 'zod';

const updateProductImageSchema = z.object({
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
}).strict();

export const updateProductParamsSchema = z.object({
  id: z.string().uuid(),
}).strict();

export const updateProductBodySchema = z.object({
  categoryId: z
    .string()
    .uuid()
    .optional(),

  name: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .optional(),

  description: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional(),

  sku: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .optional(),

  priceInCents: z
    .number()
    .int()
    .positive()
    .optional(),

  discountInCents: z
    .number()
    .int()
    .min(0)
    .optional(),

  stock: z
    .number()
    .int()
    .min(0)
    .optional(),

  status: z
    .enum(['DRAFT', 'ACTIVE', 'INACTIVE'])
    .optional(),

  images: z
    .array(updateProductImageSchema)
    .max(10)
    .optional(),
}).strict();

export type UpdateProductParamsDto = z.infer<
  typeof updateProductParamsSchema
>;

export type UpdateProductBodyDto = z.infer<
  typeof updateProductBodySchema
>;
