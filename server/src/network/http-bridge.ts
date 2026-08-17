import http from "node:http";
import { SayoDBConfig } from "../config/schema.js";
import { mainStore } from "../engine/store.js";
import { semanticStore } from "../engine/vector/index.js";
import { commandRegistry } from "../commands/registry.js";
import { parseCommandArgs } from "../utils/args-parser.js";
import { clientRegistry } from "./client-registry.js";
import { logger } from "../utils/logger.js";

export class HTTPBridgeServer {
  private server: http.Server | null = null;
  private config: SayoDBConfig;
  private port: number;

  constructor(config: SayoDBConfig) {
    this.config = config;
    this.port = config.port + 1; // e.g. 6381
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        // Set CORS headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        const url = req.url || "/";

        if (req.method === "GET" && (url === "/api/status" || url === "/api/status/")) {
          this.handleStatus(res);
          return;
        }

        if (req.method === "POST" && (url === "/api/exec" || url === "/api/exec/")) {
          this.handleExec(req, res);
          return;
        }

        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
      });

      this.server.on("error", (err: Error) => {
        logger.error({ err }, "HTTP Bridge Server error");
        reject(err);
      });

      this.server.listen(this.port, this.config.host, () => {
        logger.info(`sayoDB HTTP Bridge server listening on ${this.config.host}:${this.port}`);
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
        host: this.config.host,
        dbSize: mainStore.dbsize(),
        memoryUsage: formattedMem,
        connectedClients: clientRegistry.activeCount(),
        keys: keyList,
        vectorItems: items,
      })
    );
  }

  private handleExec(req: http.IncomingMessage, res: http.ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
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

        const mockClient: any = {
          serverConfig: this.config,
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
