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
  maxPayloadSize: number; // Max payload buffer size in bytes (default 64MB)
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
  protectedMode: boolean;
  renameCommands: Record<string, string>;
  tlsEnabled: boolean;
  tlsCertFile?: string;
  tlsKeyFile?: string;
  tlsCaFile?: string;
  tlsAuthClients?: boolean;
  tlsRejectUnauthorized?: boolean;
}

export const DEFAULT_CONFIG: SayoDBConfig = {
  port: 6380,
  host: "127.0.0.1",
  maxConnections: 1000,
  timeout: 300, // 300 seconds (5 minutes) idle socket timeout
  maxPayloadSize: 64 * 1024 * 1024, // 64MB max payload ceiling
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
  protectedMode: true,
  renameCommands: {},
  tlsEnabled: false,
};
