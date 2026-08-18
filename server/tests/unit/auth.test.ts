import { describe, it, expect, beforeEach } from "vitest";
import { safeComparePassword } from "../../src/utils/security.js";
import { CommandRegistry } from "../../src/commands/registry.js";
import { MemoryStore } from "../../src/engine/store.js";
import { DEFAULT_CONFIG, SayoDBConfig } from "../../src/config/schema.js";
import { RESPParser } from "../../src/protocol/parser.js";
import { clientRegistry } from "../../src/network/client-registry.js";

describe("Password Protection & AUTH Authentication Engine", () => {
  describe("Constant-Time Timing-Safe Comparison Utility", () => {
    it("should return true for identical matching passwords", () => {
      expect(safeComparePassword("secret123", "secret123")).toBe(true);
      expect(safeComparePassword("", "")).toBe(true);
    });

    it("should return false for mismatched passwords", () => {
      expect(safeComparePassword("wrongpass", "secret123")).toBe(false);
      expect(safeComparePassword("secret124", "secret123")).toBe(false);
    });

    it("should return false safely when byte lengths differ without throwing error", () => {
      expect(safeComparePassword("short", "verylongsecretpassword")).toBe(false);
      expect(safeComparePassword("verylongsecretpassword", "short")).toBe(false);
    });
  });

  describe("Command Registry Authentication Guard & Interception", () => {
    let registry: CommandRegistry;
    let store: MemoryStore;
    let parser: RESPParser;

    beforeEach(() => {
      registry = new CommandRegistry();
      store = new MemoryStore();
      parser = new RESPParser();
    });

    const createMockClient = (config: SayoDBConfig, isAuthenticated = false) => {
      return {
        id: 1,
        socket: {} as any,
        serverConfig: config,
        isAuthenticated,
        selectedDbIndex: 0,
      };
    };

    it("should reject commands with NOAUTH when requirePass is configured and client is unauthenticated", () => {
      const config: SayoDBConfig = { ...DEFAULT_CONFIG, requirePass: "topsecret" };
      const client = createMockClient(config, false);

      const resBuffer = registry.dispatch({
        store,
        client: client as any,
        commandName: "SET",
        args: ["foo", "bar"],
      });

      expect(resBuffer.toString()).toContain("-NOAUTH Authentication required.");
    });

    it("should allow PING when client is unauthenticated", () => {
      const config: SayoDBConfig = { ...DEFAULT_CONFIG, requirePass: "topsecret" };
      const client = createMockClient(config, false);

      const resBuffer = registry.dispatch({
        store,
        client: client as any,
        commandName: "PING",
        args: [],
      });

      expect(resBuffer.toString()).toBe("+PONG\r\n");
    });

    it("should authenticate client successfully with AUTH command and correct password", () => {
      const config: SayoDBConfig = { ...DEFAULT_CONFIG, requirePass: "topsecret" };
      const client = createMockClient(config, false);

      const resBuffer = registry.dispatch({
        store,
        client: client as any,
        commandName: "AUTH",
        args: ["topsecret"],
      });

      expect(resBuffer.toString()).toBe("+OK\r\n");
      expect(client.isAuthenticated).toBe(true);

      // Subsequent commands should succeed after authentication
      const setBuffer = registry.dispatch({
        store,
        client: client as any,
        commandName: "SET",
        args: ["foo", "bar"],
      });

      expect(setBuffer.toString()).toBe("+OK\r\n");
    });

    it("should return invalid password error and remain unauthenticated when AUTH password is wrong", () => {
      const config: SayoDBConfig = { ...DEFAULT_CONFIG, requirePass: "topsecret" };
      const client = createMockClient(config, false);

      const resBuffer = registry.dispatch({
        store,
        client: client as any,
        commandName: "AUTH",
        args: ["wrongpass"],
      });

      expect(resBuffer.toString()).toContain("-ERR invalid password");
      expect(client.isAuthenticated).toBe(false);
    });

    it("should return error if AUTH is sent when server has no requirePass configured", () => {
      const config: SayoDBConfig = { ...DEFAULT_CONFIG, requirePass: undefined };
      const client = createMockClient(config, true);

      const resBuffer = registry.dispatch({
        store,
        client: client as any,
        commandName: "AUTH",
        args: ["topsecret"],
      });

      expect(resBuffer.toString()).toContain("-ERR Client sent AUTH, but no password is set");
    });
  });

  describe("Client Registry Authentication Status Formatting", () => {
    it("reports 'No Auth Required' when server has no requirePass set", () => {
      const mockConn: any = { id: 99, remoteAddress: "127.0.0.1", isAuthenticated: true, isLoopback: true };
      clientRegistry.register(mockConn);

      const noPassConfig: SayoDBConfig = { ...DEFAULT_CONFIG, requirePass: undefined };
      const info = clientRegistry.getClientsInfo(noPassConfig);
      const target = info.find((c: any) => c.id === 99);
      expect(target?.authStatus).toBe("No Auth Required");

      clientRegistry.unregister(99);
    });
  });
});
