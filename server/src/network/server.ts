import net from "node:net";
import tls from "node:tls";
import fs from "node:fs";
import path from "node:path";
import { SayoDBConfig } from "../config/schema.js";
import { ClientConnection } from "./connection.js";
import { clientRegistry } from "./client-registry.js";
import { logger } from "../utils/logger.js";

export class TCPServer {
  private server: net.Server | tls.Server | null = null;
  private config: SayoDBConfig;

  constructor(config: SayoDBConfig) {
    this.config = config;
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const handleSocket = (socket: net.Socket | tls.TLSSocket) => {
        // Enforce maxConnections limit to prevent file descriptor exhaustion
        if (clientRegistry.activeCount() >= this.config.maxConnections) {
          logger.warn(
            { remoteAddress: socket.remoteAddress, limit: this.config.maxConnections },
            "Connection rejected: max clients limit reached"
          );
          socket.write("-ERR max number of clients reached\r\n");
          socket.destroy();
          return;
        }

        // Disable Nagle's algorithm for low-latency DB packet transmission
        socket.setNoDelay(true);
        socket.setKeepAlive(true, 30000);

        const clientId = clientRegistry.generateId();
        const connection = new ClientConnection(clientId, socket, this.config);
        clientRegistry.register(connection);

        logger.debug({ clientId, remoteAddress: socket.remoteAddress, tls: this.config.tlsEnabled }, "Client connected");

        socket.on("close", () => {
          clientRegistry.unregister(clientId);
          logger.debug({ clientId }, "Client disconnected");
        });
      };

      try {
        if (this.config.tlsEnabled) {
          if (!this.config.tlsCertFile || !this.config.tlsKeyFile) {
            throw new Error("TLS is enabled but tlsCertFile or tlsKeyFile is missing in config.");
          }

          const certPath = path.resolve(process.cwd(), this.config.tlsCertFile);
          const keyPath = path.resolve(process.cwd(), this.config.tlsKeyFile);

          const tlsOptions: tls.TlsOptions = {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath),
            requestCert: this.config.tlsAuthClients ?? false,
            rejectUnauthorized: this.config.tlsRejectUnauthorized ?? false,
          };

          if (this.config.tlsCaFile) {
            const caPath = path.resolve(process.cwd(), this.config.tlsCaFile);
            tlsOptions.ca = fs.readFileSync(caPath);
          }

          this.server = tls.createServer(tlsOptions, handleSocket);
        } else {
          this.server = net.createServer(handleSocket);
        }
      } catch (err: any) {
        logger.error({ err: err.message }, "Failed to initialize server transport");
        return reject(err);
      }

      this.server.on("error", (err: Error) => {
        logger.error({ err }, "Server transport error");
        reject(err);
      });

      this.server.listen(this.config.port, this.config.host, () => {
        const protocol = this.config.tlsEnabled ? "TLS/SSL" : "TCP";
        logger.info(`sayoDB ${protocol} server listening on ${this.config.host}:${this.config.port}`);
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
        logger.info("Server transport stopped");
        resolve();
      });
    });
  }
}
