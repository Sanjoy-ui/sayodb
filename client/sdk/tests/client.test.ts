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

  it("instantiates client with custom options", () => {
    const client = new SayoDBClient({ host: "127.0.0.1", port: 6380, timeout: 3000 });
    expect(client).toBeDefined();
  });
});
