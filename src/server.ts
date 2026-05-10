import { buildApp } from "./app";
import { env } from "./config/env";

export async function startServer(): Promise<void> {
  const app = await buildApp();

  try {
    await app.listen({
      port: env.port,
      host: "0.0.0.0",
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}
