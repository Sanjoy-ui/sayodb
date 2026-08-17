import { DataObject, createDataObject, isExpired, DataType } from "./data-object.js";
import { diskSpillStore } from "./disk/store.js";
import { logger } from "../utils/logger.js";

export class MemoryStore {
  private db: Map<string, DataObject> = new Map();

  public getRaw(key: string): DataObject | null {
    // 1. Check L1 RAM
    let obj: DataObject | null = this.db.get(key) || null;

    if (obj) {
      if (isExpired(obj)) {
        this.db.delete(key);
        return null;
      }
      obj.lastAccessed = Date.now();
      return obj;
    }

    // 2. Check L2 Cold Disk Store (Hot Promotion)
    if (diskSpillStore.hasKv(key)) {
      obj = diskSpillStore.getKv(key);
      if (!obj) return null;

      if (isExpired(obj)) {
        diskSpillStore.removeKv(key);
        return null;
      }

      // Promote back to L1 RAM & remove from L2 Disk
      obj.lastAccessed = Date.now();
      this.db.set(key, obj);
      diskSpillStore.removeKv(key);

      logger.debug({ key }, "[ZERO-OOM SPILLING] Promoted spilled key from L2 Disk to L1 RAM");
      return obj;
    }

    return null;
  }

  public get(key: string): any | null {
    const obj = this.getRaw(key);
    return obj ? obj.value : null;
  }

  public set(key: string, value: any, type: DataType = "string", ttlMs: number | null = null): void {
    if (diskSpillStore.hasKv(key)) {
      diskSpillStore.removeKv(key);
    }

    const obj = createDataObject(type, value, ttlMs);
    this.db.set(key, obj);
  }

  public delete(key: string): boolean {
    const inRam = this.db.delete(key);
    const inDisk = diskSpillStore.removeKv(key);
    return inRam || inDisk;
  }

  public deleteRamOnly(key: string): boolean {
    return this.db.delete(key);
  }

  public exists(key: string): boolean {
    return this.getRaw(key) !== null;
  }

  public expire(key: string, ttlMs: number): boolean {
    const obj = this.getRaw(key);
    if (!obj) return false;

    obj.expiresAt = Date.now() + ttlMs;
    return true;
  }

  public ttl(key: string): number {
    const obj = this.getRaw(key);
    if (!obj) return -2; // Key does not exist
    if (obj.expiresAt === null) return -1; // Persistent key (no expiration)

    const remaining = Math.ceil((obj.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  public keys(pattern = "*"): string[] {
    const matched: string[] = [];
    const regex = this.globToRegex(pattern);

    // Check RAM keys
    for (const [key, obj] of this.db.entries()) {
      if (isExpired(obj)) {
        this.db.delete(key);
        continue;
      }

      if (regex.test(key)) {
        matched.push(key);
      }
    }

    // Check Disk keys
    for (const key of diskSpillStore.getAllSpilledKvKeys()) {
      if (!this.db.has(key) && regex.test(key)) {
        matched.push(key);
      }
    }

    return matched;
  }

  public dbsize(): number {
    // Perform cleanup of expired keys on size check
    for (const [key, obj] of this.db.entries()) {
      if (isExpired(obj)) {
        this.db.delete(key);
      }
    }
    return this.db.size + diskSpillStore.countSpilledKv();
  }

  public flushdb(): void {
    this.db.clear();
    diskSpillStore.clearAll();
  }

  public getEntries(): [string, DataObject][] {
    return Array.from(this.db.entries());
  }

  private globToRegex(glob: string): RegExp {
    const escaped = glob
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    return new RegExp(`^${escaped}$`);
  }
}

export const mainStore = new MemoryStore();
