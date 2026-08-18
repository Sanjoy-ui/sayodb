import { describe, it, expect, beforeEach } from "vitest";
import { commandRegistry } from "../../src/commands/registry.js";
import { DEFAULT_CONFIG, SayoDBConfig } from "../../src/config/schema.js";
import { CommandContext } from "../../src/commands/base.js";
import { mainStore } from "../../src/engine/store.js";

describe("CONFIG GET and CONFIG SET Command Handlers", () => {
  let mockConfig: SayoDBConfig;

  beforeEach(() => {
    mockConfig = { ...DEFAULT_CONFIG };
  });

  const createContext = (commandName: string, args: string[]): CommandContext => ({
    commandName,
    args,
    client: {
      serverConfig: mockConfig,
      isLoopback: true,
      isAuthenticated: true,
    } as any,
    store: mainStore,
  });

  describe("CONFIG GET", () => {
    it("returns maxconnections setting", () => {
      const resp = commandRegistry.dispatch(createContext("CONFIG", ["GET", "maxconnections"]));
      const text = resp.toString();
      expect(text).toContain("maxconnections");
      expect(text).toContain("1000");
    });

    it("returns all settings when wildcard * is specified", () => {
      const resp = commandRegistry.dispatch(createContext("CONFIG", ["GET", "*"]));
      const text = resp.toString();
      expect(text).toContain("maxconnections");
      expect(text).toContain("timeout");
      expect(text).toContain("maxpayload");
      expect(text).toContain("default-ttl");
      expect(text).toContain("protected-mode");
    });
  });

  describe("CONFIG SET", () => {
    it("dynamically updates maxconnections", () => {
      const resp = commandRegistry.dispatch(createContext("CONFIG", ["SET", "maxconnections", "2500"]));
      expect(resp.toString()).toContain("+OK");
      expect(mockConfig.maxConnections).toBe(2500);
    });

    it("dynamically updates timeout", () => {
      const resp = commandRegistry.dispatch(createContext("CONFIG", ["SET", "timeout", "600"]));
      expect(resp.toString()).toContain("+OK");
      expect(mockConfig.timeout).toBe(600);
    });

    it("dynamically updates maxpayload", () => {
      const resp = commandRegistry.dispatch(createContext("CONFIG", ["SET", "maxpayload", "128MB"]));
      expect(resp.toString()).toContain("+OK");
      expect(mockConfig.maxPayloadSize).toBe(128 * 1024 * 1024);
    });

    it("dynamically updates default-ttl", () => {
      const resp = commandRegistry.dispatch(createContext("CONFIG", ["SET", "default-ttl", "180"]));
      expect(resp.toString()).toContain("+OK");
      expect(mockConfig.defaultTtl).toBe(180);
    });

    it("rejects invalid values for maxconnections", () => {
      const resp = commandRegistry.dispatch(createContext("CONFIG", ["SET", "maxconnections", "invalid"]));
      expect(resp.toString()).toContain("ERR");
      expect(mockConfig.maxConnections).toBe(1000); // Unchanged
    });
  });
});
