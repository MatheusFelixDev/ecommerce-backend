import { z } from "zod";

const webhookIdSchema = z.union([z.string(), z.number()]);

export const mercadoPagoWebhookBodySchema = z
  .object({
    id: webhookIdSchema.optional(),
    type: z.string().optional(),
    topic: z.string().optional(),
    action: z.string().optional(),
    resource: z.string().optional(),
    data: z
      .object({
        id: webhookIdSchema,
      })
      .optional(),
  })
  .passthrough();

export const mercadoPagoWebhookQuerySchema = z
  .object({
    "data.id": webhookIdSchema.optional(),
    id: webhookIdSchema.optional(),
    type: z.string().optional(),
    topic: z.string().optional(),
  })
  .passthrough();

export type MercadoPagoWebhookBody = z.infer<
  typeof mercadoPagoWebhookBodySchema
>;

export type MercadoPagoWebhookQuery = z.infer<
  typeof mercadoPagoWebhookQuerySchema
>;
