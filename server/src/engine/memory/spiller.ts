import { mainStore } from "../store.js";
import { semanticStore } from "../vector/index.js";
import { diskSpillStore } from "../disk/store.js";
import { logger } from "../../utils/logger.js";
import { SayoDBConfig } from "../../config/schema.js";

export class MemorySpillerService {
  private timer: NodeJS.Timeout | null = null;
  private config: SayoDBConfig | null = null;
  private isSpilling = false;

  public start(config: SayoDBConfig, checkIntervalMs = 5000): void {
    this.config = config;
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      this.checkAndSpill();
    }, checkIntervalMs);

    logger.info(
      {
        thresholdPercent: `${(config.spillThresholdPercent * 100).toFixed(0)}%`,
        targetPercent: `${(config.spillTargetPercent * 100).toFixed(0)}%`,
        maxMemoryMb: (config.maxMemory / (1024 * 1024)).toFixed(0),
      },
      "Memory Spiller Worker started"
    );
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public checkAndSpill(): void {
    if (this.isSpilling || !this.config || !this.config.spillEnabled) return;

    const memUsage = process.memoryUsage();
    const heapUsed = memUsage.heapUsed;
    const maxMemory = this.config.maxMemory > 0 ? this.config.maxMemory : 512 * 1024 * 1024;

    const currentUsagePercent = heapUsed / maxMemory;

    if (currentUsagePercent >= this.config.spillThresholdPercent) {
      this.performSpill();
    }
  }

  public performSpill(forceCount?: number): void {
    this.isSpilling = true;

    const memUsage = process.memoryUsage();
    const currentHeap = memUsage.heapUsed;
    const maxMemory = this.config?.maxMemory && this.config.maxMemory > 0 ? this.config.maxMemory : 256 * 1024 * 1024;
    const targetHeap = maxMemory * (this.config?.spillTargetPercent || 0.7);

    logger.warn(
      {
        currentMb: (currentHeap / (1024 * 1024)).toFixed(1),
        maxMb: (maxMemory / (1024 * 1024)).toFixed(1),
        usagePercent: `${((currentHeap / maxMemory) * 100).toFixed(1)}%`,
        thresholdPercent: `${((this.config?.spillThresholdPercent || 0.85) * 100).toFixed(0)}%`,
      },
      "[ZERO-OOM SPILLING] Memory pressure threshold reached! Initiating cold key spill to L2 disk..."
    );

    let spilledKvCount = 0;
    let spilledVectorCount = 0;

    try {
      // 1. Collect and sort Key-Value entries by lastAccessed (LRU)
      const kvEntries = mainStore.getEntries().sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

      for (const [key, obj] of kvEntries) {
        if (!forceCount && process.memoryUsage().heapUsed <= targetHeap) break;
        if (forceCount && spilledKvCount >= forceCount) break;

        diskSpillStore.putKv(key, obj);
        mainStore.deleteRamOnly(key);
        spilledKvCount++;
      }

      // 2. Collect and sort Vector entries by createdAt (LRU)
      const vectorEntries = semanticStore.getEntries().sort((a, b) => a[1].createdAt - b[1].createdAt);

      for (const [id, item] of vectorEntries) {
        if (!forceCount && process.memoryUsage().heapUsed <= targetHeap) break;
        if (forceCount && spilledVectorCount >= forceCount) break;

        diskSpillStore.putVector(id, item);
        semanticStore.deleteRamOnly(id);
        spilledVectorCount++;
      }

      const finalHeap = process.memoryUsage().heapUsed;

      logger.info(
        {
          spilledKvCount,
          spilledVectorCount,
          newHeapMb: (finalHeap / (1024 * 1024)).toFixed(1),
          newUsagePercent: `${((finalHeap / maxMemory) * 100).toFixed(1)}%`,
        },
        "[ZERO-OOM SPILLING] Cold key spill completed successfully! RAM pressure relieved."
      );
    } catch (err) {
      logger.error({ err }, "Error occurred during memory spill execution");
    } finally {
      this.isSpilling = false;
    }
  }
}

export const memorySpillerService = new MemorySpillerService();
