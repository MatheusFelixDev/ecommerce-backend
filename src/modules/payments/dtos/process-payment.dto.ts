import { z } from "zod";

export const processPaymentParamsSchema = z.object({
  orderId: z.string().uuid(),
});

export type ProcessPaymentParams = z.infer<typeof processPaymentParamsSchema>;
