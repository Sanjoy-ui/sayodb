import { describe, it, expect, beforeEach, afterEach } from "vitest";
import net from "node:net";
import { DEFAULT_CONFIG } from "../../src/config/schema.js";
import { loadConfig } from "../../src/config/loader.js";
import { RESPParser, PayloadTooLargeError } from "../../src/protocol/parser.js";
import { TCPServer } from "../../src/network/server.js";

describe("Rate Limiting & DoS Guard Security Controls", () => {
  describe("Default Configuration Limits", () => {
    it("has secure default limits for DoS protection", () => {
      expect(DEFAULT_CONFIG.maxConnections).toBe(1000);
      expect(DEFAULT_CONFIG.timeout).toBe(300);
      expect(DEFAULT_CONFIG.maxPayloadSize).toBe(64 * 1024 * 1024); // 64MB
    });

    it("parses maxclients, timeout, and maxpayload from CLI/env overrides", () => {
      const origEnv = { ...process.env };
      process.env.SAYODB_MAX_CLIENTS = "500";
      process.env.SAYODB_TIMEOUT = "120";
      process.env.SAYODB_MAX_PAYLOAD = "32MB";

      const config = loadConfig("non-existent-file.conf");
      expect(config.maxConnections).toBe(500);
      expect(config.timeout).toBe(120);
      expect(config.maxPayloadSize).toBe(32 * 1024 * 1024);

      process.env = origEnv;
    });
  });

  describe("RESPParser Payload Size Guard", () => {
    it("allows payloads within maxPayloadSize limit", () => {
      const parser = new RESPParser(1024); // 1KB limit
      parser.append(Buffer.from("*1\r\n$5\r\nHELLO\r\n"));
      const msg = parser.parseNext();
      expect(msg?.name).toBe("HELLO");
    });

    it("throws PayloadTooLargeError when appending data exceeding maxPayloadSize", () => {
      const parser = new RESPParser(50);
      expect(() => {
        parser.append(Buffer.alloc(60));
      }).toThrow(PayloadTooLargeError);
    });

    it("throws PayloadTooLargeError when bulk string header declares excessive length", () => {
      const parser = new RESPParser(1024);
      parser.append(Buffer.from("$20000000\r\n"));
      expect(() => {
        parser.parseNext();
      }).toThrow(PayloadTooLargeError);
    });
  });

  describe("TCP Server Connection Caps & Timeouts", () => {
    let server: TCPServer | null = null;
    const testPort = 6399;

    afterEach(async () => {
      if (server) {
        await server.stop();
        server = null;
      }
    });

    it("rejects connections when maxConnections limit is reached", async () => {
      const config = {
        ...DEFAULT_CONFIG,
        port: testPort,
        host: "127.0.0.1",
        maxConnections: 2,
        protectedMode: false,
      };

      server = new TCPServer(config);
      await server.start();

      const sockets: net.Socket[] = [];

      // Open 2 allowed connections
      const c1 = net.connect({ port: testPort, host: "127.0.0.1" });
      const c2 = net.connect({ port: testPort, host: "127.0.0.1" });
      sockets.push(c1, c2);

      await new Promise((res) => setTimeout(res, 50));

      // Attempt 3rd connection which should be rejected
      const c3 = net.connect({ port: testPort, host: "127.0.0.1" });
      sockets.push(c3);

      const responsePromise = new Promise<string>((resolve) => {
        c3.on("data", (data) => {
          resolve(data.toString());
        });
      });

      const response = await responsePromise;
      expect(response).toContain("-ERR max number of clients reached");

      for (const s of sockets) {
        s.destroy();
      }
    });
  });
});
