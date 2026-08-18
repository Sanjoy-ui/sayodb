import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { SayoDBConfig } from "../config/schema.js";
import { mainStore } from "../engine/store.js";
import { semanticStore } from "../engine/vector/index.js";
import { commandRegistry } from "../commands/registry.js";
import { parseCommandArgs } from "../utils/args-parser.js";
import { clientRegistry } from "./client-registry.js";
import { safeComparePassword } from "../utils/security.js";
import { isProtectedModeActive, isLoopbackIP } from "../utils/network-security.js";
import { logger } from "../utils/logger.js";

export class HTTPBridgeServer {
  private server: http.Server | https.Server | null = null;
  private config: SayoDBConfig;
  private port: number;

  constructor(config: SayoDBConfig) {
    this.config = config;
    this.port = config.port + 1; // e.g. 6381
  }

  private isAuthorized(req: http.IncomingMessage, parsedUrl: URL): boolean {
    if (!this.config.requirePass) return true;

    // Check Authorization header (Bearer token or raw token)
    const authHeader = req.headers["authorization"] || req.headers["x-sayodb-password"];
    let providedPass = "";

    if (authHeader) {
      const headerStr = Array.isArray(authHeader) ? authHeader[0] : authHeader;
      if (headerStr.startsWith("Bearer ")) {
        providedPass = headerStr.slice(7).trim();
      } else {
        providedPass = headerStr.trim();
      }
    } else {
      // Check query parameter ?password=xxx
      providedPass = parsedUrl.searchParams.get("password") || "";
    }

    if (!providedPass) return false;
    return safeComparePassword(providedPass, this.config.requirePass);
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const requestListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
        const clientIP = req.socket.remoteAddress || "127.0.0.1";
        const isClientLoopback = isLoopbackIP(clientIP);
        const protectedMode = isProtectedModeActive(this.config);

        // Restrict CORS under Protected Mode to mitigate cross-site attack vectors
        const allowedOrigin = protectedMode && !this.config.requirePass
          ? (req.headers.origin && isLoopbackIP(req.headers.origin) ? req.headers.origin : "http://localhost")
          : "*";

        res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-SayoDB-Password");

        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        // Enforce Protected Mode for non-loopback HTTP API calls
        if (protectedMode && !isClientLoopback) {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error:
                "DENIED Protected mode enabled. Connections from remote clients are blocked. Set requirepass or bind to 127.0.0.1.",
            })
          );
          return;
        }

        const rawUrl = req.url || "/";
        const parsedUrl = new URL(rawUrl, `http://${req.headers.host || "localhost"}`);
        const pathname = parsedUrl.pathname;

        if (!this.isAuthorized(req, parsedUrl)) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "NOAUTH Authentication required." }));
          return;
        }

        if (req.method === "GET" && (pathname === "/api/status" || pathname === "/api/status/")) {
          this.handleStatus(res);
          return;
        }

        if (req.method === "POST" && (pathname === "/api/exec" || pathname === "/api/exec/")) {
          this.handleExec(req, res);
          return;
        }

        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
      };

      try {
        if (this.config.tlsEnabled && this.config.tlsCertFile && this.config.tlsKeyFile) {
          const certPath = path.resolve(process.cwd(), this.config.tlsCertFile);
          const keyPath = path.resolve(process.cwd(), this.config.tlsKeyFile);
          const httpsOptions: https.ServerOptions = {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath),
          };
          this.server = https.createServer(httpsOptions, requestListener);
        } else {
          this.server = http.createServer(requestListener);
        }
      } catch (err: any) {
        logger.error({ err: err.message }, "Failed to initialize HTTP Bridge server transport");
        return reject(err);
      }

      this.server.on("error", (err: Error) => {
        logger.error({ err }, "HTTP Bridge Server error");
        reject(err);
      });

      this.server.listen(this.port, this.config.host, () => {
        const protocol = (this.config.tlsEnabled && this.config.tlsCertFile && this.config.tlsKeyFile) ? "HTTPS" : "HTTP";
        logger.info(`sayoDB ${protocol} Bridge server listening on ${this.config.host}:${this.port}`);
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
        logger.info("HTTP Bridge server stopped");
        resolve();
      });
    });
  }

  private handleStatus(res: http.ServerResponse): void {
    const memory = process.memoryUsage();
    const formattedMem = (memory.heapUsed / 1024 / 1024).toFixed(2) + " MB";
    const keys = mainStore.keys("*");

    const keyList = keys.map((key) => {
      const obj = mainStore.getRaw(key);
      const ttlSec = mainStore.ttl(key);
      return {
        key,
        type: obj?.type || "string",
        value: String(obj?.value || ""),
        ttl: ttlSec === -1 ? "Persistent" : `${ttlSec}s`,
      };
    });

    const items: any[] = [];
    for (const item of (semanticStore as any).items.values()) {
      const ttl = item.expiresAt ? `${Math.ceil((item.expiresAt - Date.now()) / 1000)}s` : "Persistent";
      items.push({
        id: item.id,
        prompt: item.prompt,
        response: item.response,
        namespace: item.namespace,
        tag: item.tag || "none",
        expiresAt: ttl,
        vector: item.vector ? Array.from(item.vector) : [],
      });
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        online: true,
        port: this.config.port,
        httpPort: this.port,
        host: this.config.host,
        protectedModeActive: isProtectedModeActive(this.config),
        protectedModeConfig: this.config.protectedMode !== false,
        requirePassSet: Boolean(this.config.requirePass && this.config.requirePass.trim().length > 0),
        maxConnections: this.config.maxConnections,
        timeout: this.config.timeout,
        maxPayloadSize: this.config.maxPayloadSize,
        defaultTtl: this.config.defaultTtl,
        dbSize: mainStore.dbsize(),
        memoryUsage: formattedMem,
        connectedClients: clientRegistry.activeCount(),
        clients: clientRegistry.getClientsInfo(this.config),
        keys: keyList,
        vectorItems: items,
      })
    );
  }

  private handleExec(req: http.IncomingMessage, res: http.ServerResponse): void {
    let body = "";
    let bodyBytes = 0;
    let exceeded = false;

    req.on("data", (chunk) => {
      if (exceeded) return;
      bodyBytes += chunk.length;
      if (bodyBytes > this.config.maxPayloadSize) {
        exceeded = true;
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Payload size exceeds maximum allowed ceiling" }));
        req.destroy();
        return;
      }
      body += chunk;
    });

    req.on("end", () => {
      if (exceeded) return;
      try {
        const payload = JSON.parse(body || "{}");
        const rawCmd = payload.command || "";
        if (!rawCmd.trim()) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Empty command" }));
          return;
        }

        const parts = parseCommandArgs(rawCmd);
        const commandName = parts[0];
        const args = parts.slice(1);

        const clientIP = req.socket.remoteAddress || "127.0.0.1";
        const mockClient: any = {
          serverConfig: this.config,
          remoteAddress: clientIP,
          isLoopback: isLoopbackIP(clientIP),
        };

        const respBuffer = commandRegistry.dispatch({
          store: mainStore,
          client: mockClient,
          commandName,
          args,
        });

        const respStr = this.decodeRESPBuffer(respBuffer);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ command: rawCmd, response: respStr }));
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message || "Failed to execute command" }));
      }
    });
  }

  private decodeRESPBuffer(buf: Buffer): string {
    const str = buf.toString("utf-8");
    const first = str[0];

    if (first === "+") {
      return str.substring(1).replace(/\r\n$/, "");
    }
    if (first === "-") {
      return str.substring(1).replace(/\r\n$/, "");
    }
    if (first === ":") {
      return `(integer) ${str.substring(1).replace(/\r\n$/, "")}`;
    }
    if (first === "$") {
      if (str.startsWith("$-1")) return "(nil)";
      const lines = str.split("\r\n");
      return `"${lines[1]}"`;
    }
    if (first === "*") {
      if (str.startsWith("*-1")) return "(empty array)";
      const lines = str.split("\r\n").filter((l) => l && !l.startsWith("*") && !l.startsWith("$"));
      return lines.map((l, i) => `${i + 1}) "${l}"`).join("\n");
    }

    return str;
  }
}
