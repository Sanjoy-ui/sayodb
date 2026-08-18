import { loadConfig, formatMemorySize } from "./config/loader.js";
import { TCPServer } from "./network/server.js";
import { HTTPBridgeServer } from "./network/http-bridge.js";
import { activeExpiryTicker } from "./engine/memory/expiry.js";
import { memorySpillerService } from "./engine/memory/spiller.js";
import { isProtectedModeActive } from "./utils/network-security.js";
import { logger } from "./utils/logger.js";

async function main() {
  logger.info("Initializing sayoDB server...");

  const config = loadConfig();

  if (isProtectedModeActive(config)) {
    logger.warn(
      `[SECURITY WARNING] sayoDB is running in Protected Mode because it is bound to ${config.host} without a password. Queries from remote clients will be BLOCKED. To allow remote connections, set requirepass / SAYODB_PASSWORD or bind to 127.0.0.1.`
    );
  }

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
      protectedMode: isProtectedModeActive(config) ? "ACTIVE (wildcard 0.0.0.0 without pass)" : "disabled/normal",
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
