import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "../../src/engine/store.js";

describe("MemoryStore", () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  it("stores and retrieves string values", () => {
    store.set("user:1", "Rahul");
    expect(store.get("user:1")).toBe("Rahul");
    expect(store.exists("user:1")).toBe(true);
  });

  it("deletes keys", () => {
    store.set("key1", "val1");
    expect(store.delete("key1")).toBe(true);
    expect(store.get("key1")).toBeNull();
  });

  it("handles custom key expiry (TTL)", async () => {
    store.set("shortKey", "temp", "string", 50); // 50ms TTL
    expect(store.get("shortKey")).toBe("temp");

    await new Promise((r) => setTimeout(r, 70));
    expect(store.get("shortKey")).toBeNull();
  });

  it("filters keys using glob patterns", () => {
    store.set("user:100", "a");
    store.set("user:200", "b");
    store.set("order:1", "c");

    expect(store.keys("user:*")).toEqual(["user:100", "user:200"]);
    expect(store.keys("*")).toEqual(["user:100", "user:200", "order:1"]);
  });
});
