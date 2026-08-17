import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CONFIG, SayoDBConfig, EvictionPolicy, AofFsyncPolicy } from "./schema.js";
import { logger } from "../utils/logger.js";

export function loadConfig(configPath?: string): SayoDBConfig {
  const config: SayoDBConfig = { ...DEFAULT_CONFIG };

  const targetPath = configPath || path.resolve(process.cwd(), "sayodb.conf");

  if (!fs.existsSync(targetPath)) {
    logger.warn(`Configuration file not found at ${targetPath}. Using defaults.`);
    return config;
  }

  try {
    const content = fs.readFileSync(targetPath, "utf-8");
    const lines = content.split("\n");

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const [key, ...valueParts] = line.split(/\s+/);
      const val = valueParts.join(" ").trim();

      switch (key.toLowerCase()) {
        case "port":
          config.port = parseInt(val, 10) || DEFAULT_CONFIG.port;
          break;
        case "host":
          config.host = val;
          break;
        case "maxconnections":
          config.maxConnections = parseInt(val, 10) || DEFAULT_CONFIG.maxConnections;
          break;
        case "maxmemory":
          config.maxMemory = parseMemorySize(val);
          break;
        case "maxmemory-policy":
          config.maxMemoryPolicy = val as EvictionPolicy;
          break;
        case "default-ttl":
          config.defaultTtl = parseInt(val, 10);
          if (isNaN(config.defaultTtl)) config.defaultTtl = DEFAULT_CONFIG.defaultTtl;
          break;
        case "appendonly":
          config.appendOnly = val.toLowerCase() === "yes" || val.toLowerCase() === "true";
          break;
        case "appendfilename":
          config.appendFilename = val.replace(/^["']|["']$/g, "");
          break;
        case "appendfsync":
          config.appendFsync = val as AofFsyncPolicy;
          break;
        case "requirepass":
          config.requirePass = val;
          break;
        case "loglevel":
          config.logLevel = val as SayoDBConfig["logLevel"];
          break;
        case "spill-enabled":
          config.spillEnabled = val.toLowerCase() === "yes" || val.toLowerCase() === "true";
          break;
        case "spill-threshold":
          const thresh = parseFloat(val);
          if (!isNaN(thresh)) {
            config.spillThresholdPercent = thresh > 1 ? thresh / 100 : thresh;
          }
          break;
        case "spill-target":
          const target = parseFloat(val);
          if (!isNaN(target)) {
            config.spillTargetPercent = target > 1 ? target / 100 : target;
          }
          break;
        case "spill-disk-path":
          config.spillDiskPath = val.replace(/^["']|["']$/g, "");
          break;
      }
    }

    // Override with environment variables if present
    if (process.env.SAYODB_SPILL_THRESHOLD) {
      const val = parseFloat(process.env.SAYODB_SPILL_THRESHOLD);
      if (!isNaN(val)) config.spillThresholdPercent = val > 1 ? val / 100 : val;
    }
    if (process.env.SAYODB_SPILL_TARGET) {
      const val = parseFloat(process.env.SAYODB_SPILL_TARGET);
      if (!isNaN(val)) config.spillTargetPercent = val > 1 ? val / 100 : val;
    }

    logger.info(`Loaded configuration successfully from ${targetPath}`);
  } catch (error) {
    logger.error({ error }, `Failed to parse config file ${targetPath}`);
  }

  return config;
}

export function parseMemorySize(raw: string): number {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "0" || trimmed === "unlimited") return 0;

  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = trimmed.match(/^(\d+)\s*([a-zA-Z]*)$/);
  if (!match) return parseInt(trimmed, 10) || 0;

  const num = parseInt(match[1], 10);
  const unit = match[2];

  return num * (units[unit] || 1);
}

export function formatMemorySize(bytes: number): string {
  if (bytes <= 0) return "unlimited";
  if (bytes >= 1024 * 1024 * 1024 && bytes % (1024 * 1024 * 1024) === 0) {
    return `${bytes / (1024 * 1024 * 1024)}GB (${bytes} bytes)`;
  }
  if (bytes >= 1024 * 1024 && bytes % (1024 * 1024) === 0) {
    return `${bytes / (1024 * 1024)}MB (${bytes} bytes)`;
  }
  if (bytes >= 1024 && bytes % 1024 === 0) {
    return `${bytes / 1024}KB (${bytes} bytes)`;
  }
  return `${bytes} bytes`;
}
