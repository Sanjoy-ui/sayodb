export type EvictionPolicy =
  | "noeviction"
  | "allkeys-lru"
  | "volatile-lru"
  | "allkeys-lfu";

export type AofFsyncPolicy = "always" | "everysec" | "no";

export interface SayoDBConfig {
  port: number;
  host: string;
  maxConnections: number;
  timeout: number;
  requirePass?: string;
  maxMemory: number; // 0 = unlimited
  maxMemoryPolicy: EvictionPolicy;
  defaultTtl: number; // Default TTL in seconds (0 = persistent)
  appendOnly: boolean;
  appendFilename: string;
  appendFsync: AofFsyncPolicy;
  saveRdbFilename: string;
  logLevel: "debug" | "info" | "warn" | "error";
  spillEnabled: boolean;
  spillThresholdPercent: number; // e.g. 0.85 for 85%
  spillTargetPercent: number; // e.g. 0.70 for 70%
  spillDiskPath: string;
}

export const DEFAULT_CONFIG: SayoDBConfig = {
  port: 6380,
  host: "127.0.0.1",
  maxConnections: 10000,
  timeout: 0,
  maxMemory: 256 * 1024 * 1024, // 256MB (secure default limit)
  maxMemoryPolicy: "noeviction",
  defaultTtl: 60,
  appendOnly: true,
  appendFilename: "sayodb.aof",
  appendFsync: "everysec",
  saveRdbFilename: "dump.rdb",
  logLevel: "info",
  spillEnabled: true,
  spillThresholdPercent: 0.85, // Configurable default 85% RAM threshold
  spillTargetPercent: 0.70, // Spills down to 70% target
  spillDiskPath: "data/spill.db",
};
