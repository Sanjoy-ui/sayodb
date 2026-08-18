import { describe, it, expect } from "vitest";
import { isWildcardHost, isLoopbackIP, isProtectedModeActive } from "../../src/utils/network-security.js";
import { DEFAULT_CONFIG, SayoDBConfig } from "../../src/config/schema.js";

describe("Network Security Utilities", () => {
  describe("isWildcardHost", () => {
    it("identifies IPv4 and IPv6 wildcard host listeners", () => {
      expect(isWildcardHost("0.0.0.0")).toBe(true);
      expect(isWildcardHost("::")).toBe(true);
      expect(isWildcardHost("0:0:0:0:0:0:0:0")).toBe(true);
      expect(isWildcardHost("*")).toBe(true);
      expect(isWildcardHost("UNSPECIFIED")).toBe(true);
    });

    it("returns false for specific loopback or interface IPs", () => {
      expect(isWildcardHost("127.0.0.1")).toBe(false);
      expect(isWildcardHost("192.168.1.50")).toBe(false);
      expect(isWildcardHost("localhost")).toBe(false);
    });
  });

  describe("isLoopbackIP", () => {
    it("identifies IPv4 and IPv6 loopback addresses correctly", () => {
      expect(isLoopbackIP("127.0.0.1")).toBe(true);
      expect(isLoopbackIP("127.0.0.2")).toBe(true);
      expect(isLoopbackIP("::1")).toBe(true);
      expect(isLoopbackIP("::ffff:127.0.0.1")).toBe(true);
      expect(isLoopbackIP("localhost")).toBe(true);
    });

    it("returns false for non-loopback IP addresses", () => {
      expect(isLoopbackIP("192.168.1.100")).toBe(false);
      expect(isLoopbackIP("10.0.0.1")).toBe(false);
      expect(isLoopbackIP("8.8.8.8")).toBe(false);
      expect(isLoopbackIP(undefined)).toBe(false);
    });
  });

  describe("isProtectedModeActive", () => {
    it("triggers protected mode when bound to 0.0.0.0 without a password", () => {
      const config: SayoDBConfig = {
        ...DEFAULT_CONFIG,
        host: "0.0.0.0",
        requirePass: undefined,
        protectedMode: true,
      };
      expect(isProtectedModeActive(config)).toBe(true);
    });

    it("does NOT trigger protected mode when bound to 127.0.0.1", () => {
      const config: SayoDBConfig = {
        ...DEFAULT_CONFIG,
        host: "127.0.0.1",
        requirePass: undefined,
        protectedMode: true,
      };
      expect(isProtectedModeActive(config)).toBe(false);
    });

    it("does NOT trigger protected mode when a password is configured", () => {
      const config: SayoDBConfig = {
        ...DEFAULT_CONFIG,
        host: "0.0.0.0",
        requirePass: "supersecret",
        protectedMode: true,
      };
      expect(isProtectedModeActive(config)).toBe(false);
    });

    it("does NOT trigger protected mode when protectedMode is explicitly set to false", () => {
      const config: SayoDBConfig = {
        ...DEFAULT_CONFIG,
        host: "0.0.0.0",
        requirePass: undefined,
        protectedMode: false,
      };
      expect(isProtectedModeActive(config)).toBe(false);
    });
  });
});
