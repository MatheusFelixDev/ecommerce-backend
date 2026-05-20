import dotenv from 'dotenv';

dotenv.config({
  path: '.env.test',
  override: true,
});

process.env.NODE_ENV = 'test';

function setDefaultEnv(name: string, value: string): void {
  if (!process.env[name]) {
    process.env[name] = value;
  }
}

setDefaultEnv(
  'DATABASE_URL',
  'postgresql://postgres:postgres@localhost:5432/ecommerce_test_db',
);
setDefaultEnv('JWT_SECRET', 'test_jwt_secret_with_at_least_32_chars');
setDefaultEnv('JWT_EXPIRES_IN', '1d');

setDefaultEnv('MELHOR_ENVIO_ENABLED', 'false');
setDefaultEnv(
  'MELHOR_ENVIO_BASE_URL',
  'https://sandbox.melhorenvio.com.br',
);
setDefaultEnv('MELHOR_ENVIO_ACCESS_TOKEN', '');
setDefaultEnv(
  'MELHOR_ENVIO_USER_AGENT',
  'ecommerce-backend-test (test@example.com)',
);
setDefaultEnv('MELHOR_ENVIO_ORIGIN_ZIP_CODE', '00000000');

setDefaultEnv('MERCADO_PAGO_ENABLED', 'false');
setDefaultEnv(
  'MERCADO_PAGO_BASE_URL',
  'https://api.mercadopago.com',
);
setDefaultEnv('MERCADO_PAGO_ACCESS_TOKEN', '');
setDefaultEnv('MERCADO_PAGO_PUBLIC_KEY', '');
setDefaultEnv('MERCADO_PAGO_WEBHOOK_SECRET', '');
setDefaultEnv(
  'MERCADO_PAGO_SUCCESS_URL',
  'http://localhost:3000/payments/success',
);
setDefaultEnv(
  'MERCADO_PAGO_FAILURE_URL',
  'http://localhost:3000/payments/failure',
);
setDefaultEnv(
  'MERCADO_PAGO_PENDING_URL',
  'http://localhost:3000/payments/pending',
);
setDefaultEnv(
  'MERCADO_PAGO_NOTIFICATION_URL',
  'http://localhost:3000/api/payments/webhooks/mercado-pago',
);
