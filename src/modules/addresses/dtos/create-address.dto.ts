import { z } from 'zod';

export const createAddressSchema = z.object({
  label: z.string().trim().max(50).optional(),

  recipientName: z.string().trim().min(2).max(100).optional(),

  phone: z.string().trim().min(8).max(20).optional(),

  zipCode: z.string().trim().min(8).max(20),

  street: z.string().trim().min(2).max(150),

  number: z.string().trim().min(1).max(20),

  complement: z.string().trim().max(100).optional(),

  neighborhood: z.string().trim().min(2).max(100),

  city: z.string().trim().min(2).max(100),

  state: z.string().trim().min(2).max(50),

  country: z.string().trim().min(2).max(80).optional(),

  isMain: z.boolean().optional(),
});

export type CreateAddressDto = z.infer<
  typeof createAddressSchema
>;
