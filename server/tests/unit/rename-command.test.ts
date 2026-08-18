import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { CommandRegistry } from "../../src/commands/registry.js";
import { loadConfig } from "../../src/config/loader.js";
import { SayoDBConfig, DEFAULT_CONFIG } from "../../src/config/schema.js";
import { MemoryStore } from "../../src/engine/store.js";
import { ClientConnection } from "../../src/network/connection.js";

describe("Dangerous Command Obfuscation & Disabling (rename-command)", () => {
  let registry: CommandRegistry;
  let store: MemoryStore;
  let mockClient: any;

  beforeEach(() => {
    registry = new CommandRegistry();
    store = new MemoryStore();
    mockClient = {
      id: 1,
      serverConfig: { ...DEFAULT_CONFIG, renameCommands: {} },
      isAuthenticated: true,
      isLoopback: true,
      remoteAddress: "127.0.0.1",
    };
  });

  function createContext(commandName: string, args: string[] = [], config?: SayoDBConfig) {
    return {
      store,
      client: {
        ...mockClient,
        serverConfig: config || mockClient.serverConfig,
      },
      commandName,
      args,
    };
  }

  describe("CommandRegistry.resolveCommandName", () => {
    it("returns command name unchanged when no rename rules exist", () => {
      expect(registry.resolveCommandName("FLUSHALL", {})).toBe("FLUSHALL");
      expect(registry.resolveCommandName("ping", {})).toBe("PING");
    });

    it("returns null when command is disabled via empty target string", () => {
      const renameMap = { FLUSHALL: "" };
      expect(registry.resolveCommandName("FLUSHALL", renameMap)).toBeNull();
      expect(registry.resolveCommandName("flushall", renameMap)).toBeNull();
      expect(registry.resolveCommandName("", renameMap)).toBeNull();
    });

    it("returns null when calling old name of a renamed command", () => {
      const renameMap = { FLUSHALL: "SECURE_PURGE_99" };
      expect(registry.resolveCommandName("FLUSHALL", renameMap)).toBeNull();
      expect(registry.resolveCommandName("flushall", renameMap)).toBeNull();
    });

    it("resolves target alias to original command name", () => {
      const renameMap = { FLUSHALL: "SECURE_PURGE_99" };
      expect(registry.resolveCommandName("SECURE_PURGE_99", renameMap)).toBe("FLUSHALL");
      expect(registry.resolveCommandName("secure_purge_99", renameMap)).toBe("FLUSHALL");
    });
  });

  describe("Command Execution & Interception", () => {
    it("completely disables FLUSHALL when rename-command FLUSHALL is ''", () => {
      store.set("k1", "v1");
      const config: SayoDBConfig = {
        ...DEFAULT_CONFIG,
        renameCommands: { FLUSHALL: "" },
      };

      const res = registry.dispatch(createContext("FLUSHALL", [], config));
      const resStr = res.toString();
      expect(resStr).toContain("ERR unknown command 'FLUSHALL'");
      // Verify store was not flushed
      expect(store.get("k1")).toBe("v1");
    });

    it("allows execution under obfuscated name when FLUSHALL is renamed", () => {
      store.set("k1", "v1");
      store.set("k2", "v2");
      const config: SayoDBConfig = {
        ...DEFAULT_CONFIG,
        renameCommands: { FLUSHALL: "SECURE_PURGE_99" },
      };

      // Calling original name fails as unknown
      const resOld = registry.dispatch(createContext("FLUSHALL", [], config));
      expect(resOld.toString()).toContain("ERR unknown command 'FLUSHALL'");
      expect(store.dbsize()).toBe(2);

      // Calling obfuscated name succeeds and flushes database
      const resNew = registry.dispatch(createContext("SECURE_PURGE_99", [], config));
      expect(resNew.toString()).toContain("+OK");
      expect(store.dbsize()).toBe(0);
    });

    it("supports multiple rename-command directives concurrently", () => {
      const config: SayoDBConfig = {
        ...DEFAULT_CONFIG,
        renameCommands: {
          FLUSHALL: "",
          SEMFLUSH: "",
          FLUSHDB: "SUPER_FLUSH_88",
        },
      };

      expect(registry.dispatch(createContext("FLUSHALL", [], config)).toString()).toContain("ERR unknown command 'FLUSHALL'");
      expect(registry.dispatch(createContext("SEMFLUSH", [], config)).toString()).toContain("ERR unknown command 'SEMFLUSH'");
      expect(registry.dispatch(createContext("FLUSHDB", [], config)).toString()).toContain("ERR unknown command 'FLUSHDB'");

      // Obfuscated name works
      const resFlush = registry.dispatch(createContext("SUPER_FLUSH_88", [], config));
      expect(resFlush.toString()).toContain("+OK");
    });
  });

  describe("sayodb.conf Config Loader Parsing", () => {
    it("parses rename-command directives from config file correctly", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sayodb-test-"));
      const confFile = path.join(tmpDir, "sayodb.conf");

      const confContent = `
port 6389
rename-command FLUSHALL ""
rename-command SEMFLUSH ""
rename-command SAVE "SECURE_SAVE_123"
rename-command BGSAVE 'MY_BGSAVE'
`;
      fs.writeFileSync(confFile, confContent);

      const config = loadConfig(confFile);
      expect(config.renameCommands).toEqual({
        FLUSHALL: "",
        SEMFLUSH: "",
        SAVE: "SECURE_SAVE_123",
        BGSAVE: "MY_BGSAVE",
      });

      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("parses SAYODB_RENAME_COMMANDS environment variable", () => {
      process.env.SAYODB_RENAME_COMMANDS = "FLUSHALL=,SEMFLUSH=SECRET_SEM";
      const config = loadConfig("/non/existent/path.conf");

      expect(config.renameCommands.FLUSHALL).toBe("");
      expect(config.renameCommands.SEMFLUSH).toBe("SECRET_SEM");

      delete process.env.SAYODB_RENAME_COMMANDS;
    });
  });

  describe("CONFIG GET rename-command", () => {
    it("returns JSON representation of renameCommands map", () => {
      const config: SayoDBConfig = {
        ...DEFAULT_CONFIG,
        renameCommands: { FLUSHALL: "SECURE_PURGE" },
      };

      const res = registry.dispatch(createContext("CONFIG", ["GET", "rename-command"], config));
      const resStr = res.toString();
      expect(resStr).toContain("rename-command");
      expect(resStr).toContain("SECURE_PURGE");
    });
  });
});
