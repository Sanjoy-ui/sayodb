export type DataType = "string" | "hash" | "list" | "set" | "zset";

export interface DataObject {
  type: DataType;
  value: any;
  createdAt: number;
  lastAccessed: number;
  expiresAt: number | null; // epoch timestamp in ms, null if persistent
}

export function createDataObject(type: DataType, value: any, ttlMs: number | null = null): DataObject {
  const now = Date.now();
  return {
    type,
    value,
    createdAt: now,
    lastAccessed: now,
    expiresAt: ttlMs !== null ? now + ttlMs : null,
  };
}

export function isExpired(obj: DataObject): boolean {
  if (obj.expiresAt === null) return false;
  return Date.now() >= obj.expiresAt;
}
