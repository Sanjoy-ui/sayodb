import { mainStore } from "../store.js";
import { logger } from "../../utils/logger.js";

export class ActiveExpiryTicker {
  private timer: NodeJS.Timeout | null = null;
  private intervalMs = 100;
  private sampleCount = 20;

  public start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.intervalMs);
    logger.info(`Active TTL expiration manager started (sampling every ${this.intervalMs}ms)`);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    const entries = mainStore.getEntries();
    if (entries.length === 0) return;

    // Pick up to sampleCount random keys with TTL
    let checked = 0;
    let expiredCount = 0;

    for (let i = 0; i < Math.min(entries.length, this.sampleCount); i++) {
      const randomIndex = Math.floor(Math.random() * entries.length);
      const [key, obj] = entries[randomIndex];

      if (obj.expiresAt !== null) {
        checked++;
        if (Date.now() >= obj.expiresAt) {
          mainStore.delete(key);
          expiredCount++;
        }
      }
    }

    if (expiredCount > 0) {
      logger.debug({ checked, expiredCount }, "Active TTL cleanup expired keys");
    }
  }
}

export const activeExpiryTicker = new ActiveExpiryTicker();
