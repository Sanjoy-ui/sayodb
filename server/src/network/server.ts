import net from "node:net";
import { SayoDBConfig } from "../config/schema.js";
import { ClientConnection } from "./connection.js";
import { clientRegistry } from "./client-registry.js";
import { logger } from "../utils/logger.js";

export class TCPServer {
  private server: net.Server | null = null;
  private config: SayoDBConfig;

  constructor(config: SayoDBConfig) {
    this.config = config;
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket: net.Socket) => {
        // Disable Nagle's algorithm for low-latency DB packet transmission
        socket.setNoDelay(true);
        socket.setKeepAlive(true, 30000);

        const clientId = clientRegistry.generateId();
        const connection = new ClientConnection(clientId, socket, this.config);
        clientRegistry.register(connection);

        logger.debug({ clientId, remoteAddress: socket.remoteAddress }, "Client connected");

        socket.on("close", () => {
          clientRegistry.unregister(clientId);
          logger.debug({ clientId }, "Client disconnected");
        });
      });

      this.server.on("error", (err: Error) => {
        logger.error({ err }, "TCP Server error");
        reject(err);
      });

      this.server.listen(this.config.port, this.config.host, () => {
        logger.info(`sayoDB TCP server listening on ${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close(() => {
        logger.info("TCP server stopped");
        resolve();
      });
    });
  }
}
