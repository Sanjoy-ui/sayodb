import fs from "node:fs";
import path from "node:path";
import { DataObject } from "../data-object.js";
import { SemanticItem } from "../vector/index.js";
import { logger } from "../../utils/logger.js";

export class DiskSpillStore {
  private diskDirPath: string;
  private kvFilePath: string;
  private vectorFilePath: string;

  private spilledKvIndex: Map<string, DataObject> = new Map();
  private spilledVectorIndex: Map<string, SemanticItem> = new Map();

  constructor(storageDir = "data/spill") {
    this.diskDirPath = path.resolve(process.cwd(), storageDir);
    this.kvFilePath = path.join(this.diskDirPath, "spilled_kv.json");
    this.vectorFilePath = path.join(this.diskDirPath, "spilled_vector.json");
    this.init();
  }

  private init(): void {
    try {
      if (!fs.existsSync(this.diskDirPath)) {
        fs.mkdirSync(this.diskDirPath, { recursive: true });
      }

      if (fs.existsSync(this.kvFilePath)) {
        const raw = fs.readFileSync(this.kvFilePath, "utf-8");
        if (raw.trim()) {
          const entries: [string, DataObject][] = JSON.parse(raw);
          this.spilledKvIndex = new Map(entries);
        }
      }

      if (fs.existsSync(this.vectorFilePath)) {
        const raw = fs.readFileSync(this.vectorFilePath, "utf-8");
        if (raw.trim()) {
          const entries: [string, any][] = JSON.parse(raw);
          for (const [id, item] of entries) {
            this.spilledVectorIndex.set(id, {
              ...item,
              vector: new Float32Array(item.vector),
            });
          }
        }
      }
    } catch (err) {
      logger.error({ err }, "Failed initializing DiskSpillStore");
    }
  }

  private persist(): void {
    try {
      if (!fs.existsSync(this.diskDirPath)) {
        fs.mkdirSync(this.diskDirPath, { recursive: true });
      }
      fs.writeFileSync(
        this.kvFilePath,
        JSON.stringify(Array.from(this.spilledKvIndex.entries()))
      );

      const vectorEntries = Array.from(this.spilledVectorIndex.entries()).map(
        ([id, item]) => [
          id,
          {
            ...item,
            vector: Array.from(item.vector),
          },
        ]
      );
      fs.writeFileSync(this.vectorFilePath, JSON.stringify(vectorEntries));
    } catch (err) {
      logger.error({ err }, "Failed persisting spilled data to disk");
    }
  }

  // --- Key-Value Spilling Operations ---
  public hasKv(key: string): boolean {
    return this.spilledKvIndex.has(key);
  }

  public getKv(key: string): DataObject | null {
    const obj = this.spilledKvIndex.get(key);
    if (!obj) return null;
    return obj;
  }

  public putKv(key: string, obj: DataObject): void {
    this.spilledKvIndex.set(key, obj);
    this.persist();
  }

  public removeKv(key: string): boolean {
    const deleted = this.spilledKvIndex.delete(key);
    if (deleted) this.persist();
    return deleted;
  }

  public getAllSpilledKvKeys(): string[] {
    return Array.from(this.spilledKvIndex.keys());
  }

  // --- Vector Item Spilling Operations ---
  public hasVector(id: string): boolean {
    return this.spilledVectorIndex.has(id);
  }

  public getVector(id: string): SemanticItem | null {
    const item = this.spilledVectorIndex.get(id);
    if (!item) return null;
    return item;
  }

  public putVector(id: string, item: SemanticItem): void {
    this.spilledVectorIndex.set(id, item);
    this.persist();
  }

  public removeVector(id: string): boolean {
    const deleted = this.spilledVectorIndex.delete(id);
    if (deleted) this.persist();
    return deleted;
  }

  public getAllSpilledVectorItems(): SemanticItem[] {
    return Array.from(this.spilledVectorIndex.values());
  }

  public countSpilledKv(): number {
    return this.spilledKvIndex.size;
  }

  public countSpilledVector(): number {
    return this.spilledVectorIndex.size;
  }

  public clearAll(): void {
    this.spilledKvIndex.clear();
    this.spilledVectorIndex.clear();
    this.persist();
  }
}

export const diskSpillStore = new DiskSpillStore();
