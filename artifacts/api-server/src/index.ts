import dotenv from "dotenv";

// Load environment variables BEFORE importing anything else
dotenv.config();

// Debug: Lihat environment variables
console.log("=== ENV DEBUG ===");
console.log("LOG_LEVEL:", process.env.LOG_LEVEL);
console.log("GOOGLE_SERVICE_ACCOUNT_JSON set:", !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
console.log("GOOGLE_DRIVE_FOLDER_ID:", process.env.GOOGLE_DRIVE_FOLDER_ID);
console.log("PORT:", process.env.PORT);
console.log("================");

import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
