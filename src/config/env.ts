import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT) || 3000,

  databaseUrl: process.env.DATABASE_URL || "",

  jwtSecret: process.env.JWT_SECRET || "",

  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",

  melhorEnvioEnabled:
    process.env.MELHOR_ENVIO_ENABLED === "true",

  melhorEnvioBaseUrl:
    process.env.MELHOR_ENVIO_BASE_URL ||
    "https://sandbox.melhorenvio.com.br",

  melhorEnvioAccessToken:
    process.env.MELHOR_ENVIO_ACCESS_TOKEN || "",

  melhorEnvioUserAgent:
    process.env.MELHOR_ENVIO_USER_AGENT ||
    "ecommerce-backend (dev@example.com)",

  melhorEnvioOriginZipCode:
    process.env.MELHOR_ENVIO_ORIGIN_ZIP_CODE || "",
};
