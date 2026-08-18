import { describe, it, expect } from "vitest";
import { SayoDBClient } from "../src/index.js";

describe("@sayodb/client SDK Interface", () => {
  it("instantiates client with default host and port", () => {
    const client = new SayoDBClient();
    expect(client).toBeDefined();
    expect(typeof client.connect).toBe("function");
    expect(typeof client.set).toBe("function");
    expect(typeof client.get).toBe("function");
    expect(typeof client.del).toBe("function");
    expect(typeof client.incr).toBe("function");
    expect(typeof client.decr).toBe("function");
  });

  it("instantiates client with custom options and checks all convenience methods", () => {
    const client = new SayoDBClient({ host: "127.0.0.1", port: 6380, timeout: 3000 });
    expect(client).toBeDefined();
    expect(typeof client.mget).toBe("function");
    expect(typeof client.mset).toBe("function");
    expect(typeof client.info).toBe("function");
    expect(typeof client.dbsize).toBe("function");
    expect(typeof client.incrby).toBe("function");
    expect(typeof client.type).toBe("function");
    expect(typeof client.echo).toBe("function");
    expect(typeof client.configGet).toBe("function");
    expect(typeof client.configSet).toBe("function");
  });
});
