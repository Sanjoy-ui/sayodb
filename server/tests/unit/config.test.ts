import { describe, it, expect } from "vitest";
import { parseMemorySize, formatMemorySize, loadConfig } from "../../src/config/loader.js";

describe("Server Config & Memory Limits", () => {
  it("defaults maxMemory to 256MB (secure default limit)", () => {
    const config = loadConfig("/non/existent/path/sayodb.conf");
    expect(config.maxMemory).toBe(256 * 1024 * 1024);
  });

  it("parses memory size strings correctly", () => {
    expect(parseMemorySize("256mb")).toBe(256 * 1024 * 1024);
    expect(parseMemorySize("1gb")).toBe(1024 * 1024 * 1024);
    expect(parseMemorySize("512kb")).toBe(512 * 1024);
    expect(parseMemorySize("100")).toBe(100);
    expect(parseMemorySize("0")).toBe(0);
    expect(parseMemorySize("unlimited")).toBe(0);
  });

  it("formats memory size for human readable logging", () => {
    expect(formatMemorySize(256 * 1024 * 1024)).toBe("256MB (268435456 bytes)");
    expect(formatMemorySize(1024 * 1024 * 1024)).toBe("1GB (1073741824 bytes)");
    expect(formatMemorySize(0)).toBe("unlimited");
  });
});
