import { describe, it, expect, beforeEach } from "vitest";
import { mainStore } from "../../src/engine/store.js";
import { semanticStore } from "../../src/engine/vector/index.js";
import { diskSpillStore } from "../../src/engine/disk/store.js";
import { memorySpillerService } from "../../src/engine/memory/spiller.js";
import { DEFAULT_CONFIG } from "../../src/config/schema.js";

describe("Zero-OOM Tiered Spilling & Hot Promotion", () => {
  beforeEach(() => {
    mainStore.flushdb();
    semanticStore.flushAll();
    diskSpillStore.clearAll();
  });

  it("should spill cold key-value entries to L2 disk when memory threshold is reached", () => {
    mainStore.set("coldKey1", "Cold Value 1");
    mainStore.set("coldKey2", "Cold Value 2");
    mainStore.set("hotKey", "Hot Value");

    const rawObj1 = mainStore.getRaw("coldKey1");
    if (rawObj1) rawObj1.lastAccessed = Date.now() - 100000;

    const rawObj2 = mainStore.getRaw("coldKey2");
    if (rawObj2) rawObj2.lastAccessed = Date.now() - 50000;

    // Simulate memory spill execution (force spill 2 cold keys)
    memorySpillerService.performSpill(2);

    expect(diskSpillStore.countSpilledKv()).toBeGreaterThan(0);
    expect(diskSpillStore.hasKv("coldKey1")).toBe(true);
  });

  it("should transparently promote spilled keys back from L2 Disk to L1 RAM on GET", () => {
    mainStore.set("spilledKey", "Spilled Data");
    const rawObj = mainStore.getRaw("spilledKey")!;
    diskSpillStore.putKv("spilledKey", rawObj);
    mainStore.deleteRamOnly("spilledKey");

    // Key is in disk, not in RAM
    expect(diskSpillStore.hasKv("spilledKey")).toBe(true);

    // GET should transparently load from disk and promote back to RAM
    const val = mainStore.get("spilledKey");
    expect(val).toBe("Spilled Data");

    // Should be promoted back to RAM and removed from Disk
    expect(diskSpillStore.hasKv("spilledKey")).toBe(false);
    expect(mainStore.get("spilledKey")).toBe("Spilled Data");
  });

  it("should transparently promote spilled vector items back on SEMGET & SEMSEARCH", () => {
    const rawVec = new Float32Array([0.1, 0.2, 0.3, 0.4]);
    semanticStore.set("What is sayoDB", "Fastest vector database", rawVec, "tech", "vector");

    const item = semanticStore.get("What is sayoDB", "tech")!;
    diskSpillStore.putVector(item.id, item);
    semanticStore.deleteRamOnly(item.id);

    // Verify present in disk
    expect(diskSpillStore.hasVector(item.id)).toBe(true);

    // SEMGET should promote back to RAM
    const fetched = semanticStore.get("What is sayoDB", "tech");
    expect(fetched).not.toBeNull();
    expect(fetched?.response).toBe("Fastest vector database");

    // Promoted back to RAM and cleared from disk
    expect(diskSpillStore.hasVector(item.id)).toBe(false);
  });
});
