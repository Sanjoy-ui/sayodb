import { describe, it, expect, beforeEach } from "vitest";
import { EventEmitter } from "node:events";
import { ClientConnection, ConnectionState } from "../../src/network/connection.js";
import { CommandRegistry } from "../../src/commands/registry.js";
import { DEFAULT_CONFIG, SayoDBConfig } from "../../src/config/schema.js";
import { MemoryStore } from "../../src/engine/store.js";

class MockSocket extends EventEmitter {
  public writtenData: Buffer[] = [];
  public destroyed = false;

  public write(data: Buffer | string): boolean {
    if (this.destroyed) return false;
    this.writtenData.push(typeof data === "string" ? Buffer.from(data) : data);
    return true;
  }

  public destroy(): this {
    this.destroyed = true;
    this.emit("close");
    return this;
  }

  public setTimeout(_ms: number): this {
    return this;
  }
}

describe("Client Connection Finite State Machine (FSM)", () => {
  let registry: CommandRegistry;
  let store: MemoryStore;

  beforeEach(() => {
    registry = new CommandRegistry();
    store = new MemoryStore();
  });

  describe("Initial State Evaluation", () => {
    it("starts in AUTHENTICATED state when requirePass is not configured", () => {
      const mockSocket = new MockSocket() as any;
      const conn = new ClientConnection(1, mockSocket, { ...DEFAULT_CONFIG, requirePass: undefined });

      expect(conn.state).toBe(ConnectionState.AUTHENTICATED);
      expect(conn.isAuthenticated).toBe(true);
    });

    it("starts in UNAUTHENTICATED state when requirePass is configured", () => {
      const mockSocket = new MockSocket() as any;
      const conn = new ClientConnection(1, mockSocket, { ...DEFAULT_CONFIG, requirePass: "secretpass" });

      expect(conn.state).toBe(ConnectionState.UNAUTHENTICATED);
      expect(conn.isAuthenticated).toBe(false);
    });
  });

  describe("FSM State Transitions & Command Access Control", () => {
    it("blocks data commands in UNAUTHENTICATED state", () => {
      const mockSocket = new MockSocket() as any;
      const config: SayoDBConfig = { ...DEFAULT_CONFIG, requirePass: "secretpass" };
      const conn = new ClientConnection(1, mockSocket, config);

      // GET command blocked
      const resGet = registry.dispatch({
        store,
        client: conn,
        commandName: "GET",
        args: ["mykey"],
      });
      expect(resGet.toString()).toContain("-NOAUTH Authentication required.");

      // SET command blocked
      const resSet = registry.dispatch({
        store,
        client: conn,
        commandName: "SET",
        args: ["mykey", "myval"],
      });
      expect(resSet.toString()).toContain("-NOAUTH Authentication required.");
    });

    it("allows PING and AUTH in UNAUTHENTICATED state", () => {
      const mockSocket = new MockSocket() as any;
      const config: SayoDBConfig = { ...DEFAULT_CONFIG, requirePass: "secretpass" };
      const conn = new ClientConnection(1, mockSocket, config);

      // PING is allowed
      const resPing = registry.dispatch({
        store,
        client: conn,
        commandName: "PING",
        args: [],
      });
      expect(resPing.toString()).toContain("+PONG");
    });

    it("transitions from UNAUTHENTICATED to AUTHENTICATED on valid AUTH", () => {
      const mockSocket = new MockSocket() as any;
      const config: SayoDBConfig = { ...DEFAULT_CONFIG, requirePass: "secretpass" };
      const conn = new ClientConnection(1, mockSocket, config);

      expect(conn.state).toBe(ConnectionState.UNAUTHENTICATED);

      // Invalid password stays UNAUTHENTICATED
      const resAuthBad = registry.dispatch({
        store,
        client: conn,
        commandName: "AUTH",
        args: ["wrongpass"],
      });
      expect(resAuthBad.toString()).toContain("-ERR invalid password");
      expect(conn.state).toBe(ConnectionState.UNAUTHENTICATED);

      // Valid password transitions to AUTHENTICATED
      const resAuthGood = registry.dispatch({
        store,
        client: conn,
        commandName: "AUTH",
        args: ["secretpass"],
      });
      expect(resAuthGood.toString()).toContain("+OK");
      expect(conn.state).toBe(ConnectionState.AUTHENTICATED);
      expect(conn.isAuthenticated).toBe(true);

      // Data commands now allowed
      const resSet = registry.dispatch({
        store,
        client: conn,
        commandName: "SET",
        args: ["k1", "v1"],
      });
      expect(resSet.toString()).toContain("+OK");
    });

    it("transitions to DISCONNECTED terminal state on socket close and rejects further transitions", () => {
      const mockSocket = new MockSocket() as any;
      const conn = new ClientConnection(1, mockSocket, DEFAULT_CONFIG);

      expect(conn.state).toBe(ConnectionState.AUTHENTICATED);

      // Close socket
      mockSocket.destroy();
      expect(conn.state).toBe(ConnectionState.DISCONNECTED);

      // Attempting transition out of DISCONNECTED fails
      const transitionResult = conn.transitionTo(ConnectionState.AUTHENTICATED);
      expect(transitionResult).toBe(false);
      expect(conn.state).toBe(ConnectionState.DISCONNECTED);
    });

    it("transitions to DISCONNECTED on QUIT command", () => {
      const mockSocket = new MockSocket() as any;
      const conn = new ClientConnection(1, mockSocket, DEFAULT_CONFIG);

      const resQuit = registry.dispatch({
        store,
        client: conn,
        commandName: "QUIT",
        args: [],
      });
      expect(resQuit.toString()).toContain("+OK");
      expect(conn.state).toBe(ConnectionState.DISCONNECTED);
    });
  });
});
