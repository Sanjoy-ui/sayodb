import { loadConfig, formatMemorySize } from "./config/loader.js";
import { TCPServer } from "./network/server.js";
import { HTTPBridgeServer } from "./network/http-bridge.js";
import { activeExpiryTicker } from "./engine/memory/expiry.js";
import { memorySpillerService } from "./engine/memory/spiller.js";
import { logger } from "./utils/logger.js";

async function main() {
  logger.info("Initializing sayoDB server...");

  const config = loadConfig();

  // Start active TTL expiration background ticker
  activeExpiryTicker.start();

  // Start Zero-OOM Memory Spiller Worker
  memorySpillerService.start(config);

  // Start low-latency TCP socket server
  const tcpServer = new TCPServer(config);
  await tcpServer.start();

  // Start HTTP API Bridge server for GUI & web synchronization
  const httpBridge = new HTTPBridgeServer(config);
  await httpBridge.start();

  logger.info(
    {
      tcpPort: config.port,
      httpPort: config.port + 1,
      host: config.host,
      vectorEngine: "enabled (Cosine Similarity / Float32)",
      maxMemory: formatMemorySize(config.maxMemory),
      spillThreshold: `${(config.spillThresholdPercent * 100).toFixed(0)}%`,
      spillTarget: `${(config.spillTargetPercent * 100).toFixed(0)}%`,
      aof: config.appendOnly ? "enabled" : "disabled",
    },
    "sayoDB server is ready to accept connections!"
  );

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down sayoDB gracefully...`);
    activeExpiryTicker.stop();
    memorySpillerService.stop();
    await httpBridge.stop();
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
