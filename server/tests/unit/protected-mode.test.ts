import { describe, it, expect } from "vitest";
import { commandRegistry } from "../../src/commands/registry.js";
import { mainStore } from "../../src/engine/store.js";
import { DEFAULT_CONFIG, SayoDBConfig } from "../../src/config/schema.js";

describe("Protected Mode Command Interception", () => {
  const protectedConfig: SayoDBConfig = {
    ...DEFAULT_CONFIG,
    host: "0.0.0.0",
    requirePass: undefined,
    protectedMode: true,
  };

  it("allows loopback clients to execute data read/write commands under protected mode", () => {
    const loopbackClient: any = {
      serverConfig: protectedConfig,
      remoteAddress: "127.0.0.1",
      isLoopback: true,
      isAuthenticated: true,
    };

    const res = commandRegistry.dispatch({
      store: mainStore,
      client: loopbackClient,
      commandName: "SET",
      args: ["pm_test_key", "hello"],
    });

    expect(res.toString("utf-8")).toBe("+OK\r\n");
  });

  it("blocks non-loopback clients from executing write/read commands under protected mode", () => {
    const remoteClient: any = {
      serverConfig: protectedConfig,
      remoteAddress: "192.168.1.100",
      isLoopback: false,
      isAuthenticated: true,
    };

    const res = commandRegistry.dispatch({
      store: mainStore,
      client: remoteClient,
      commandName: "SET",
      args: ["pm_test_key", "hello"],
    });

    const resStr = res.toString("utf-8");
    expect(resStr).toContain("-DENIED");
    expect(resStr).toContain("sayoDB is running in protected mode");
  });

  it("allows non-loopback clients to execute Whitelisted commands (PING, AUTH, HELP, INFO, QUIT) under protected mode", () => {
    const remoteClient: any = {
      serverConfig: protectedConfig,
      remoteAddress: "192.168.1.100",
      isLoopback: false,
      isAuthenticated: true,
    };

    const pingRes = commandRegistry.dispatch({
      store: mainStore,
      client: remoteClient,
      commandName: "PING",
      args: [],
    });
    expect(pingRes.toString("utf-8")).toBe("+PONG\r\n");
  });
});
