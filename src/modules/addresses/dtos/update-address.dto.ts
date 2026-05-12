import { z } from 'zod';

export const updateAddressSchema = z.object({
  label: z.string().trim().max(50).nullable().optional(),

  recipientName: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .nullable()
    .optional(),

  phone: z.string().trim().min(8).max(20).nullable().optional(),

  zipCode: z.string().trim().min(8).max(20).optional(),

  street: z.string().trim().min(2).max(150).optional(),

  number: z.string().trim().min(1).max(20).optional(),

  complement: z.string().trim().max(100).nullable().optional(),

  neighborhood: z.string().trim().min(2).max(100).optional(),

  city: z.string().trim().min(2).max(100).optional(),

  state: z.string().trim().min(2).max(50).optional(),

  country: z.string().trim().min(2).max(80).optional(),
});

export type UpdateAddressDto = z.infer<
  typeof updateAddressSchema
>;
