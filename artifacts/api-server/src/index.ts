// Compatibility: map VITE_CLERK_PUBLISHABLE_KEY → CLERK_PUBLISHABLE_KEY for backend
  // Replit sets the publishable key with VITE_ prefix, but Clerk Express needs it without
  if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.VITE_CLERK_PUBLISHABLE_KEY) {
    process.env.CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY;
  }

  import app from "./app";
import { logger } from "./lib/logger";
import { initProductStore } from "./lib/productStore";
import { initAlbumStore } from "./lib/albumStore";
import { initMaterialStore } from "./lib/materialStore";
import { initSettingsStore } from "./lib/settingsStore";
import { initEventStore } from "./lib/eventStore";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  logger.info("Initializing data stores...");

  await Promise.all([
    initProductStore(),
    initAlbumStore(),
    initMaterialStore(),
    initSettingsStore(),
    initEventStore(),
  ]);

  logger.info("Data stores ready. Starting server...");

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
