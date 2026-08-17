import { loadConfig, formatMemorySize } from "./config/loader.js";
import { TCPServer } from "./network/server.js";
import { activeExpiryTicker } from "./engine/memory/expiry.js";
import { logger } from "./utils/logger.js";

async function main() {
  logger.info("Initializing sayoDB server...");

  const config = loadConfig();

  // Start active TTL expiration background ticker
  activeExpiryTicker.start();

  // Start low-latency TCP socket server
  const tcpServer = new TCPServer(config);
  await tcpServer.start();

  logger.info(
    {
      port: config.port,
      host: config.host,
      maxMemory: formatMemorySize(config.maxMemory),
      evictionPolicy: config.maxMemoryPolicy,
      aof: config.appendOnly ? "enabled" : "disabled",
    },
    "sayoDB server is ready to accept connections!"
  );

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down sayoDB gracefully...`);
    activeExpiryTicker.stop();
    await tcpServer.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal error during sayoDB startup");
  process.exit(1);
});
