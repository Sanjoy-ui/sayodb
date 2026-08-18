import { SayoDBConfig } from "../config/schema.js";

/**
 * Checks if a network host interface binding is an all-interfaces wildcard.
 */
export function isWildcardHost(host: string): boolean {
  if (!host) return false;
  const h = host.trim().toLowerCase();
  return (
    h === "0.0.0.0" ||
    h === "::" ||
    h === "0:0:0:0:0:0:0:0" ||
    h === "*" ||
    h === "unspecified"
  );
}

/**
 * Checks if a client remote IP address is a local loopback interface.
 */
export function isLoopbackIP(ip: string | undefined): boolean {
  if (!ip) return false;
  const cleanIP = ip.trim().toLowerCase();

  return (
    cleanIP === "127.0.0.1" ||
    cleanIP === "::1" ||
    cleanIP === "::ffff:127.0.0.1" ||
    cleanIP === "localhost" ||
    cleanIP.startsWith("127.")
  );
}

/**
 * Evaluates whether Redis-style Protected Mode is currently active for the given configuration.
 *
 * Protected Mode is active when:
 * 1. Protected Mode is explicitly or implicitly enabled (protectedMode !== false)
 * 2. Host binding is an all-interfaces wildcard (e.g. 0.0.0.0 or ::)
 * 3. No authentication password is configured (requirePass is missing/empty)
 */
export function isProtectedModeActive(config: SayoDBConfig): boolean {
  if (config.protectedMode === false) return false;
  if (config.requirePass && config.requirePass.trim().length > 0) return false;
  return isWildcardHost(config.host);
}
