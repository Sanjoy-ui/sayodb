import crypto from "node:crypto";

/**
 * Perform constant-time string comparison using crypto.timingSafeEqual
 * to prevent side-channel timing attacks on password verification.
 */
export function safeComparePassword(provided: string, expected: string): boolean {
  const bufA = Buffer.from(provided, "utf-8");
  const bufB = Buffer.from(expected, "utf-8");

  // If lengths differ, perform a dummy timingSafeEqual call against bufA to avoid revealing length mismatch timing leaks
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
