import { z } from 'zod';

const trimmedStringSchema = z
  .string()
  .trim()
  .default('');

const booleanStringSchema = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const rawEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(3000),

  DATABASE_URL: trimmedStringSchema,

  JWT_SECRET: trimmedStringSchema,

  JWT_EXPIRES_IN: z
    .string()
    .trim()
    .min(1, 'is required')
    .default('1d'),

  CORS_ORIGINS: trimmedStringSchema,

  MELHOR_ENVIO_ENABLED: booleanStringSchema,
  MELHOR_ENVIO_BASE_URL: trimmedStringSchema,
  MELHOR_ENVIO_ACCESS_TOKEN: trimmedStringSchema,
  MELHOR_ENVIO_USER_AGENT: trimmedStringSchema,
  MELHOR_ENVIO_ORIGIN_ZIP_CODE: trimmedStringSchema,

  MERCADO_PAGO_ENABLED: booleanStringSchema,
  MERCADO_PAGO_BASE_URL: trimmedStringSchema,
  MERCADO_PAGO_ACCESS_TOKEN: trimmedStringSchema,
  MERCADO_PAGO_PUBLIC_KEY: trimmedStringSchema,
  MERCADO_PAGO_WEBHOOK_SECRET: trimmedStringSchema,
  MERCADO_PAGO_SUCCESS_URL: trimmedStringSchema,
  MERCADO_PAGO_FAILURE_URL: trimmedStringSchema,
  MERCADO_PAGO_PENDING_URL: trimmedStringSchema,
  MERCADO_PAGO_NOTIFICATION_URL: trimmedStringSchema,
});

type RawEnv = z.infer<typeof rawEnvSchema>;

const urlEnvKeys = [
  'DATABASE_URL',
  'MELHOR_ENVIO_BASE_URL',
  'MERCADO_PAGO_BASE_URL',
  'MERCADO_PAGO_SUCCESS_URL',
  'MERCADO_PAGO_FAILURE_URL',
  'MERCADO_PAGO_PENDING_URL',
  'MERCADO_PAGO_NOTIFICATION_URL',
] as const satisfies readonly (keyof RawEnv)[];

const weakJwtSecrets = new Set([
  'secret',
  'jwt_secret',
  'your_jwt_secret',
  'test',
  'test_secret',
  'test_jwt_secret',
  'test_jwt_secret_for_ci',
  'change_me',
  'changeme',
]);

const defaultLocalCorsOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
] as const;

function parseCorsOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function isValidHttpOrigin(value: string): boolean {
  try {
    const parsedUrl = new URL(value);

    return ['http:', 'https:'].includes(parsedUrl.protocol) &&
      parsedUrl.origin === value;
  } catch {
    return false;
  }
}

function addIssue(
  context: z.RefinementCtx,
  path: keyof RawEnv,
  message: string,
): void {
  context.addIssue({
    code: z.ZodIssueCode.custom,
    path: [path],
    message,
  });
}

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function requireString(
  env: RawEnv,
  context: z.RefinementCtx,
  key: keyof RawEnv,
  message = 'is required',
): void {
  const value = env[key];

  if (typeof value === 'string' && isBlank(value)) {
    addIssue(context, key, message);
  }
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);

    return true;
  } catch {
    return false;
  }
}

function isUnsafeProductionUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value);
    const hostname = parsedUrl.hostname.toLowerCase();

    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname.endsWith('.localhost') ||
      hostname.includes('ngrok')
    );
  } catch {
    return false;
  }
}

function validateCorsOrigins(
  env: RawEnv,
  context: z.RefinementCtx,
): void {
  const corsOrigins = parseCorsOrigins(env.CORS_ORIGINS);

  if (env.NODE_ENV === 'production' && corsOrigins.length === 0) {
    addIssue(context, 'CORS_ORIGINS', 'is required in production');
    return;
  }

  for (const origin of corsOrigins) {
    if (!isValidHttpOrigin(origin)) {
      addIssue(context, 'CORS_ORIGINS', 'must contain valid HTTP origins only');
      continue;
    }

    const parsedOrigin = new URL(origin);

    if (env.NODE_ENV === 'production' && parsedOrigin.protocol !== 'https:') {
      addIssue(context, 'CORS_ORIGINS', 'must use HTTPS in production');
    }

    if (env.NODE_ENV === 'production' && isUnsafeProductionUrl(origin)) {
      addIssue(
        context,
        'CORS_ORIGINS',
        'must not contain localhost, loopback or ngrok in production',
      );
    }
  }
}

function validateProvidedUrls(
  env: RawEnv,
  context: z.RefinementCtx,
): void {
  for (const key of urlEnvKeys) {
    const value = env[key];

    if (typeof value !== 'string' || isBlank(value)) {
      continue;
    }

    if (!isValidUrl(value)) {
      addIssue(context, key, 'must be a valid URL');
      continue;
    }

    if (env.NODE_ENV === 'production' && isUnsafeProductionUrl(value)) {
      addIssue(
        context,
        key,
        'must not point to localhost, loopback or ngrok in production',
      );
    }
  }
}

function validateJwtSecret(
  env: RawEnv,
  context: z.RefinementCtx,
): void {
  if (isBlank(env.JWT_SECRET)) {
    addIssue(context, 'JWT_SECRET', 'is required');
    return;
  }

  if (env.NODE_ENV !== 'production') {
    return;
  }

  const normalizedSecret = env.JWT_SECRET.toLowerCase();

  if (env.JWT_SECRET.length < 32) {
    addIssue(
      context,
      'JWT_SECRET',
      'must have at least 32 characters in production',
    );
  }

  if (weakJwtSecrets.has(normalizedSecret)) {
    addIssue(
      context,
      'JWT_SECRET',
      'must not use a weak or example value in production',
    );
  }
}

function validateMelhorEnvio(
  env: RawEnv,
  context: z.RefinementCtx,
): void {
  if (!env.MELHOR_ENVIO_ENABLED) {
    return;
  }

  requireString(env, context, 'MELHOR_ENVIO_BASE_URL');
  requireString(env, context, 'MELHOR_ENVIO_ACCESS_TOKEN');
  requireString(env, context, 'MELHOR_ENVIO_USER_AGENT');
  requireString(env, context, 'MELHOR_ENVIO_ORIGIN_ZIP_CODE');

  if (
    !isBlank(env.MELHOR_ENVIO_ORIGIN_ZIP_CODE) &&
    !/^\d{8}$/.test(env.MELHOR_ENVIO_ORIGIN_ZIP_CODE)
  ) {
    addIssue(
      context,
      'MELHOR_ENVIO_ORIGIN_ZIP_CODE',
      'must contain exactly 8 digits',
    );
  }

  if (
    env.NODE_ENV === 'production' &&
    env.MELHOR_ENVIO_ORIGIN_ZIP_CODE === '00000000'
  ) {
    addIssue(
      context,
      'MELHOR_ENVIO_ORIGIN_ZIP_CODE',
      'must not use a placeholder value in production',
    );
  }
}

function validateMercadoPago(
  env: RawEnv,
  context: z.RefinementCtx,
): void {
  if (!env.MERCADO_PAGO_ENABLED) {
    return;
  }

  requireString(env, context, 'MERCADO_PAGO_BASE_URL');
  requireString(env, context, 'MERCADO_PAGO_ACCESS_TOKEN');
  requireString(env, context, 'MERCADO_PAGO_PUBLIC_KEY');
  requireString(env, context, 'MERCADO_PAGO_WEBHOOK_SECRET');
  requireString(env, context, 'MERCADO_PAGO_SUCCESS_URL');
  requireString(env, context, 'MERCADO_PAGO_FAILURE_URL');
  requireString(env, context, 'MERCADO_PAGO_PENDING_URL');
  requireString(env, context, 'MERCADO_PAGO_NOTIFICATION_URL');
}

const envSchema = rawEnvSchema.superRefine((env, context) => {
  requireString(env, context, 'DATABASE_URL');
  validateJwtSecret(env, context);
  validateCorsOrigins(env, context);
  validateProvidedUrls(env, context);
  validateMelhorEnvio(env, context);
  validateMercadoPago(env, context);
});

export interface Env {
  nodeEnv: RawEnv['NODE_ENV'];
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigins: string[];
  melhorEnvioEnabled: boolean;
  melhorEnvioBaseUrl: string;
  melhorEnvioAccessToken: string;
  melhorEnvioUserAgent: string;
  melhorEnvioOriginZipCode: string;
  mercadoPagoEnabled: boolean;
  mercadoPagoBaseUrl: string;
  mercadoPagoAccessToken: string;
  mercadoPagoPublicKey: string;
  mercadoPagoWebhookSecret: string;
  mercadoPagoSuccessUrl: string;
  mercadoPagoFailureUrl: string;
  mercadoPagoPendingUrl: string;
  mercadoPagoNotificationUrl: string;
}

export function loadEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => {
        const path = issue.path.join('.') || 'ENV';

        return `- ${path} ${issue.message}`;
      })
      .join('\n');

    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  const parsedEnv = result.data;
  const corsOrigins = parseCorsOrigins(parsedEnv.CORS_ORIGINS);
  const resolvedCorsOrigins =
    corsOrigins.length > 0 || parsedEnv.NODE_ENV === 'production'
      ? corsOrigins
      : [...defaultLocalCorsOrigins];

  return {
    nodeEnv: parsedEnv.NODE_ENV,
    port: parsedEnv.PORT,
    databaseUrl: parsedEnv.DATABASE_URL,
    jwtSecret: parsedEnv.JWT_SECRET,
    jwtExpiresIn: parsedEnv.JWT_EXPIRES_IN,
    corsOrigins: resolvedCorsOrigins,
    melhorEnvioEnabled: parsedEnv.MELHOR_ENVIO_ENABLED,
    melhorEnvioBaseUrl: parsedEnv.MELHOR_ENVIO_BASE_URL,
    melhorEnvioAccessToken: parsedEnv.MELHOR_ENVIO_ACCESS_TOKEN,
    melhorEnvioUserAgent: parsedEnv.MELHOR_ENVIO_USER_AGENT,
    melhorEnvioOriginZipCode: parsedEnv.MELHOR_ENVIO_ORIGIN_ZIP_CODE,
    mercadoPagoEnabled: parsedEnv.MERCADO_PAGO_ENABLED,
    mercadoPagoBaseUrl: parsedEnv.MERCADO_PAGO_BASE_URL,
    mercadoPagoAccessToken: parsedEnv.MERCADO_PAGO_ACCESS_TOKEN,
    mercadoPagoPublicKey: parsedEnv.MERCADO_PAGO_PUBLIC_KEY,
    mercadoPagoWebhookSecret: parsedEnv.MERCADO_PAGO_WEBHOOK_SECRET,
    mercadoPagoSuccessUrl: parsedEnv.MERCADO_PAGO_SUCCESS_URL,
    mercadoPagoFailureUrl: parsedEnv.MERCADO_PAGO_FAILURE_URL,
    mercadoPagoPendingUrl: parsedEnv.MERCADO_PAGO_PENDING_URL,
    mercadoPagoNotificationUrl:
      parsedEnv.MERCADO_PAGO_NOTIFICATION_URL,
  };
}
