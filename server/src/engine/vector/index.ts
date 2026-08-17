export interface SemanticItem {
  id: string;
  namespace: string;
  tag?: string | undefined;
  prompt: string;
  response: string;
  vector: Float32Array; // Pre-normalized unit vector
  createdAt: number;
  expiresAt: number | null;
}

export interface SemanticSearchResult {
  hit: boolean;
  item: SemanticItem | null;
  similarity: number;
}

export function normalizeVector(vec: Float32Array): Float32Array {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }

  const norm = Math.sqrt(sumSq);
  if (norm === 0 || isNaN(norm)) {
    return vec;
  }

  const normalized = new Float32Array(vec.length);
  for (let i = 0; i < vec.length; i++) {
    normalized[i] = vec[i] / norm;
  }
  return normalized;
}

/**
 * Computes exact Cosine Similarity between two pre-normalized unit vectors.
 * When ||a|| = ||b|| = 1, Cosine Similarity reduces to a pure Dot Product (sum a_i * b_i).
 */
export function dotProduct(a: Float32Array, b: Float32Array): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Parses vector input from either text tokens, Base64 packed Float32Array, or Buffer.
 */
export function parseVectorInput(input: string | string[] | Buffer): Float32Array {
  if (Buffer.isBuffer(input)) {
    // Binary packed Float32Array buffer
    return new Float32Array(input.buffer, input.byteOffset, input.byteLength / 4);
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    // Check if Base64 encoded Float32Array
    if (trimmed.startsWith("base64:")) {
      const b64 = trimmed.substring(7);
      const buf = Buffer.from(b64, "base64");
      return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
    }

    // Space/comma separated floats
    const nums = trimmed.split(/[\s,]+/).map((v) => parseFloat(v)).filter((v) => !isNaN(v));
    return new Float32Array(nums);
  }

  if (Array.isArray(input)) {
    const nums = input.map((v) => parseFloat(v)).filter((v) => !isNaN(v));
    return new Float32Array(nums);
  }

  return new Float32Array(0);
}

import { diskSpillStore } from "../disk/store.js";
import { logger } from "../../utils/logger.js";

export class SemanticStore {
  private items: Map<string, SemanticItem> = new Map();

  public set(
    prompt: string,
    response: string,
    rawVector: Float32Array,
    namespace = "default",
    tag?: string,
    ttlMs: number | null = null
  ): void {
    const key = `${namespace}:${prompt.trim().toLowerCase()}`;
    if (diskSpillStore.hasVector(key)) {
      diskSpillStore.removeVector(key);
    }

    const normalized = normalizeVector(rawVector);
    const now = Date.now();

    this.items.set(key, {
      id: key,
      namespace,
      tag,
      prompt,
      response,
      vector: normalized,
      createdAt: now,
      expiresAt: ttlMs !== null ? now + ttlMs : null,
    });
  }

  public get(prompt: string, namespace = "default"): SemanticItem | null {
    const key = `${namespace}:${prompt.trim().toLowerCase()}`;
    let item: SemanticItem | null = this.items.get(key) || null;

    if (item) {
      if (item.expiresAt !== null && Date.now() >= item.expiresAt) {
        this.items.delete(key);
        return null;
      }
      return item;
    }

    // Check L2 Disk Store
    if (diskSpillStore.hasVector(key)) {
      item = diskSpillStore.getVector(key);
      if (!item) return null;

      if (item.expiresAt !== null && Date.now() >= item.expiresAt) {
        diskSpillStore.removeVector(key);
        return null;
      }

      // Promote back to L1 RAM & remove from L2 Disk
      this.items.set(key, item);
      diskSpillStore.removeVector(key);
      logger.debug({ key }, "[ZERO-OOM SPILLING] Promoted spilled vector item from L2 Disk to L1 RAM");
      return item;
    }

    return null;
  }

  public searchNearest(
    rawQueryVector: Float32Array,
    threshold = 0.85,
    namespace = "default",
    limit = 1
  ): SemanticSearchResult[] {
    const queryVec = normalizeVector(rawQueryVector);
    const results: SemanticSearchResult[] = [];
    const now = Date.now();

    // 1. Search RAM Tier
    for (const [key, item] of this.items.entries()) {
      if (item.expiresAt !== null && now >= item.expiresAt) {
        this.items.delete(key);
        continue;
      }

      if (namespace !== "*" && item.namespace !== namespace) {
        continue;
      }

      const sim = dotProduct(queryVec, item.vector);
      if (sim >= threshold) {
        results.push({ hit: true, item, similarity: sim });
      }
    }

    // 2. Search Disk Tier
    for (const item of diskSpillStore.getAllSpilledVectorItems()) {
      if (this.items.has(item.id)) continue;

      if (item.expiresAt !== null && now >= item.expiresAt) {
        diskSpillStore.removeVector(item.id);
        continue;
      }

      if (namespace !== "*" && item.namespace !== namespace) {
        continue;
      }

      const sim = dotProduct(queryVec, item.vector);
      if (sim >= threshold) {
        results.push({ hit: true, item, similarity: sim });
      }
    }

    // Sort by highest similarity
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  public delete(prompt: string, namespace = "default"): boolean {
    const key = `${namespace}:${prompt.trim().toLowerCase()}`;
    const inRam = this.items.delete(key);
    const inDisk = diskSpillStore.removeVector(key);
    return inRam || inDisk;
  }

  public deleteRamOnly(id: string): boolean {
    return this.items.delete(id);
  }

  public flushNamespace(namespace: string): number {
    let count = 0;
    for (const [key, item] of this.items.entries()) {
      if (item.namespace === namespace) {
        this.items.delete(key);
        count++;
      }
    }
    for (const item of diskSpillStore.getAllSpilledVectorItems()) {
      if (item.namespace === namespace) {
        diskSpillStore.removeVector(item.id);
        count++;
      }
    }
    return count;
  }

  public flushTag(tag: string): number {
    let count = 0;
    for (const [key, item] of this.items.entries()) {
      if (item.tag === tag) {
        this.items.delete(key);
        count++;
      }
    }
    for (const item of diskSpillStore.getAllSpilledVectorItems()) {
      if (item.tag === tag) {
        diskSpillStore.removeVector(item.id);
        count++;
      }
    }
    return count;
  }

  public flushAll(): void {
    this.items.clear();
    diskSpillStore.clearAll();
  }

  public size(): number {
    return this.items.size + diskSpillStore.countSpilledVector();
  }

  public getEntries(): [string, SemanticItem][] {
    return Array.from(this.items.entries());
  }

  public getAllItems(): SemanticItem[] {
    const ramItems = Array.from(this.items.values());
    const diskItems = diskSpillStore.getAllSpilledVectorItems().filter((item) => !this.items.has(item.id));
    return [...ramItems, ...diskItems];
  }
}

export const semanticStore = new SemanticStore();
