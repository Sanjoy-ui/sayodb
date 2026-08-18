import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import tls from "node:tls";
import { execSync } from "node:child_process";
import { loadConfig } from "../../src/config/loader.js";
import { DEFAULT_CONFIG, SayoDBConfig } from "../../src/config/schema.js";
import { TCPServer } from "../../src/network/server.js";

describe("Transport Layer Security (TLS/SSL Encryption)", () => {
  let tmpDir: string;
  let certFile: string;
  let keyFile: string;
  let testPort: number;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sayodb-tls-test-"));
    certFile = path.join(tmpDir, "server-cert.pem");
    keyFile = path.join(tmpDir, "server-key.pem");
    testPort = 6490;

    try {
      // Generate self-signed RSA certificate and key for testing
      execSync(
        `openssl req -x509 -newkey rsa:2048 -nodes -keyout "${keyFile}" -out "${certFile}" -days 1 -subj "/CN=localhost"`,
        { stdio: "pipe" }
      );
    } catch (err: any) {
      console.warn("Failed to generate test SSL cert with openssl:", err.message);
    }
  });

  afterAll(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe("TLS Configuration Loader", () => {
    it("loads TLS settings from sayodb.conf correctly", () => {
      const confFile = path.join(tmpDir, "sayodb.conf");
      const content = `
tls-enabled yes
tls-cert-file server-cert.pem
tls-key-file server-key.pem
tls-ca-file ca-cert.pem
tls-auth-clients yes
`;
      fs.writeFileSync(confFile, content);

      const config = loadConfig(confFile);
      expect(config.tlsEnabled).toBe(true);
      expect(config.tlsCertFile).toBe("server-cert.pem");
      expect(config.tlsKeyFile).toBe("server-key.pem");
      expect(config.tlsCaFile).toBe("ca-cert.pem");
      expect(config.tlsAuthClients).toBe(true);
    });

    it("parses environment variable SAYODB_TLS_ENABLED", () => {
      process.env.SAYODB_TLS_ENABLED = "true";
      process.env.SAYODB_TLS_CERT_FILE = "env-cert.pem";
      process.env.SAYODB_TLS_KEY_FILE = "env-key.pem";

      const config = loadConfig("/non/existent/file.conf");
      expect(config.tlsEnabled).toBe(true);
      expect(config.tlsCertFile).toBe("env-cert.pem");
      expect(config.tlsKeyFile).toBe("env-key.pem");

      delete process.env.SAYODB_TLS_ENABLED;
      delete process.env.SAYODB_TLS_CERT_FILE;
      delete process.env.SAYODB_TLS_KEY_FILE;
    });
  });

  describe("TLS Server Socket Encryption & Handshake", () => {
    it("fails to start TLS server if cert or key file is missing", async () => {
      const invalidConfig: SayoDBConfig = {
        ...DEFAULT_CONFIG,
        port: testPort,
        tlsEnabled: true,
        tlsCertFile: "missing-cert.pem",
        tlsKeyFile: "missing-key.pem",
      };

      const server = new TCPServer(invalidConfig);
      await expect(server.start()).rejects.toThrow();
    });

    it("starts TLS server and handles encrypted RESP command over TLS socket stream", async () => {
      if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
        return; // Skip if openssl was not available in build environment
      }

      const tlsConfig: SayoDBConfig = {
        ...DEFAULT_CONFIG,
        port: testPort,
        host: "127.0.0.1",
        protectedMode: false,
        tlsEnabled: true,
        tlsCertFile: certFile,
        tlsKeyFile: keyFile,
      };

      const server = new TCPServer(tlsConfig);
      await server.start();

      // Connect via TLS client socket with rejectUnauthorized: false (accepting self-signed test cert)
      const response: string = await new Promise((resolve, reject) => {
        const client = tls.connect(
          {
            host: "127.0.0.1",
            port: testPort,
            rejectUnauthorized: false,
          },
          () => {
            // Send RESP PING command over TLS
            client.write("*1\r\n$4\r\nPING\r\n");
          }
        );

        client.on("data", (data) => {
          client.end();
          resolve(data.toString());
        });

        client.on("error", (err) => {
          reject(err);
        });
      });

      expect(response).toContain("+PONG");

      await server.stop();
    });
  });
});
