import { createServer } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./db/connection";

async function main(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = createServer(app);

  server.listen(env.PORT, env.HOST, () => {
    console.info(`Clinic API listening on http://${env.HOST}:${env.PORT}/api/v1`);
  });

  const shutdown = (signal: string) => {
    console.info(`${signal} received; shutting down API.`);
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error("Clinic API failed to start:", message);
  process.exit(1);
});
