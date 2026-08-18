import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CONFIG, SayoDBConfig, EvictionPolicy, AofFsyncPolicy } from "./schema.js";
import { logger } from "../utils/logger.js";

export function loadConfig(configPath?: string): SayoDBConfig {
  const config: SayoDBConfig = { ...DEFAULT_CONFIG };

  const targetPath = configPath || path.resolve(process.cwd(), "sayodb.conf");

  if (fs.existsSync(targetPath)) {
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
          case "bind":
            config.host = val;
            break;
          case "protected-mode":
          case "protectedmode":
            config.protectedMode = val.toLowerCase() === "yes" || val.toLowerCase() === "true";
            break;
          case "maxconnections":
          case "maxclients":
            config.maxConnections = parseInt(val, 10) || DEFAULT_CONFIG.maxConnections;
            break;
          case "timeout":
            const t = parseInt(val, 10);
            if (!isNaN(t)) config.timeout = t;
            break;
          case "maxpayload":
          case "maxpayload-size":
          case "maxpayloadsize":
            config.maxPayloadSize = parseMemorySize(val);
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
          case "rename-command":
          case "renamecommand": {
            if (valueParts.length >= 1) {
              const origCmd = valueParts[0].trim().toUpperCase();
              const rawTarget = valueParts.slice(1).join(" ").trim();
              const targetCmd = rawTarget.replace(/^["']|["']$/g, "").trim().toUpperCase();
              config.renameCommands[origCmd] = targetCmd;
            }
            break;
          }
          case "tls-enabled":
          case "tlsenabled":
            config.tlsEnabled = val.toLowerCase() === "yes" || val.toLowerCase() === "true" || val.toLowerCase() === "1";
            break;
          case "tls-cert-file":
          case "tlscertfile":
          case "tls-cert":
            config.tlsCertFile = val.replace(/^["']|["']$/g, "");
            break;
          case "tls-key-file":
          case "tlskeyfile":
          case "tls-key":
            config.tlsKeyFile = val.replace(/^["']|["']$/g, "");
            break;
          case "tls-ca-file":
          case "tlscafile":
          case "tls-ca":
            config.tlsCaFile = val.replace(/^["']|["']$/g, "");
            break;
          case "tls-auth-clients":
          case "tlsauthclients":
            config.tlsAuthClients = val.toLowerCase() === "yes" || val.toLowerCase() === "true" || val.toLowerCase() === "1";
            break;
        }
      }
      logger.info(`Loaded configuration successfully from ${targetPath}`);
    } catch (error) {
      logger.error({ error }, `Failed to parse config file ${targetPath}`);
    }
  } else {
    logger.warn(`Configuration file not found at ${targetPath}. Using defaults.`);
  }

  // Override with environment variables if present
  if (process.env.SAYODB_HOST) {
    config.host = process.env.SAYODB_HOST;
  }
  if (process.env.SAYODB_PROTECTED_MODE) {
    const p = process.env.SAYODB_PROTECTED_MODE.toLowerCase();
    config.protectedMode = p === "yes" || p === "true" || p === "1";
  }
  const envPass = process.env.SAYODB_PASSWORD || process.env.SAYODB_REQUIREPASS;
  if (envPass) {
    config.requirePass = envPass;
  }
  if (process.env.SAYODB_SPILL_THRESHOLD) {
    const val = parseFloat(process.env.SAYODB_SPILL_THRESHOLD);
    if (!isNaN(val)) config.spillThresholdPercent = val > 1 ? val / 100 : val;
  }
  if (process.env.SAYODB_SPILL_TARGET) {
    const val = parseFloat(process.env.SAYODB_SPILL_TARGET);
    if (!isNaN(val)) config.spillTargetPercent = val > 1 ? val / 100 : val;
  }
  if (process.env.SAYODB_MAX_PAYLOAD) {
    config.maxPayloadSize = parseMemorySize(process.env.SAYODB_MAX_PAYLOAD);
  }
  if (process.env.SAYODB_MAX_CLIENTS || process.env.SAYODB_MAX_CONNECTIONS) {
    const val = parseInt(process.env.SAYODB_MAX_CLIENTS || process.env.SAYODB_MAX_CONNECTIONS || "", 10);
    if (!isNaN(val)) config.maxConnections = val;
  }
  if (process.env.SAYODB_TIMEOUT) {
    const val = parseInt(process.env.SAYODB_TIMEOUT, 10);
    if (!isNaN(val)) config.timeout = val;
  }
  if (process.env.SAYODB_RENAME_COMMANDS) {
    const pairs = process.env.SAYODB_RENAME_COMMANDS.split(",");
    for (const pair of pairs) {
      const [orig, target] = pair.split("=");
      if (orig) {
        const origCmd = orig.trim().toUpperCase();
        const targetCmd = (target || "").trim().replace(/^["']|["']$/g, "").toUpperCase();
        config.renameCommands[origCmd] = targetCmd;
      }
    }
  }
  if (process.env.SAYODB_TLS_ENABLED) {
    const p = process.env.SAYODB_TLS_ENABLED.toLowerCase();
    config.tlsEnabled = p === "yes" || p === "true" || p === "1";
  }
  if (process.env.SAYODB_TLS_CERT_FILE) {
    config.tlsCertFile = process.env.SAYODB_TLS_CERT_FILE;
  }
  if (process.env.SAYODB_TLS_KEY_FILE) {
    config.tlsKeyFile = process.env.SAYODB_TLS_KEY_FILE;
  }
  if (process.env.SAYODB_TLS_CA_FILE) {
    config.tlsCaFile = process.env.SAYODB_TLS_CA_FILE;
  }

  // Override with CLI command line arguments if present (--requirepass <password> / --port <port> / --host <host> / --protected-mode <yes|no>)
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--requirepass" && i + 1 < args.length) {
      config.requirePass = args[i + 1];
      i++;
    } else if (arg.startsWith("--requirepass=")) {
      config.requirePass = arg.split("=")[1];
    } else if (arg === "--port" && i + 1 < args.length) {
      const p = parseInt(args[i + 1], 10);
      if (!isNaN(p)) config.port = p;
      i++;
    } else if (arg.startsWith("--port=")) {
      const p = parseInt(arg.split("=")[1], 10);
      if (!isNaN(p)) config.port = p;
    } else if (arg === "--host" && i + 1 < args.length) {
      config.host = args[i + 1];
      i++;
    } else if (arg.startsWith("--host=")) {
      config.host = arg.split("=")[1];
    } else if (arg === "--protected-mode" && i + 1 < args.length) {
      const p = args[i + 1].toLowerCase();
      config.protectedMode = p === "yes" || p === "true" || p === "1";
      i++;
    } else if (arg.startsWith("--protected-mode=")) {
      const p = arg.split("=")[1].toLowerCase();
      config.protectedMode = p === "yes" || p === "true" || p === "1";
    } else if ((arg === "--maxpayload" || arg === "--maxpayload-size") && i + 1 < args.length) {
      config.maxPayloadSize = parseMemorySize(args[i + 1]);
      i++;
    } else if (arg.startsWith("--maxpayload=")) {
      config.maxPayloadSize = parseMemorySize(arg.split("=")[1]);
    } else if ((arg === "--maxclients" || arg === "--maxconnections") && i + 1 < args.length) {
      const p = parseInt(args[i + 1], 10);
      if (!isNaN(p)) config.maxConnections = p;
      i++;
    } else if (arg.startsWith("--maxclients=") || arg.startsWith("--maxconnections=")) {
      const p = parseInt(arg.split("=")[1], 10);
      if (!isNaN(p)) config.maxConnections = p;
    } else if (arg === "--timeout" && i + 1 < args.length) {
      const p = parseInt(args[i + 1], 10);
      if (!isNaN(p)) config.timeout = p;
      i++;
    } else if (arg.startsWith("--timeout=")) {
      const p = parseInt(arg.split("=")[1], 10);
      if (!isNaN(p)) config.timeout = p;
    } else if (arg === "--rename-command" && i + 2 < args.length) {
      const origCmd = args[i + 1].trim().toUpperCase();
      const targetCmd = args[i + 2].trim().replace(/^["']|["']$/g, "").toUpperCase();
      config.renameCommands[origCmd] = targetCmd;
      i += 2;
    } else if (arg === "--tls-enabled" || arg === "--tls") {
      config.tlsEnabled = true;
    } else if (arg.startsWith("--tls-enabled=")) {
      const p = arg.split("=")[1].toLowerCase();
      config.tlsEnabled = p === "yes" || p === "true" || p === "1";
    } else if (arg === "--tls-cert-file" && i + 1 < args.length) {
      config.tlsCertFile = args[i + 1];
      i++;
    } else if (arg.startsWith("--tls-cert-file=")) {
      config.tlsCertFile = arg.split("=")[1];
    } else if (arg === "--tls-key-file" && i + 1 < args.length) {
      config.tlsKeyFile = args[i + 1];
      i++;
    } else if (arg.startsWith("--tls-key-file=")) {
      config.tlsKeyFile = arg.split("=")[1];
    } else if (arg === "--tls-ca-file" && i + 1 < args.length) {
      config.tlsCaFile = args[i + 1];
      i++;
    } else if (arg.startsWith("--tls-ca-file=")) {
      config.tlsCaFile = arg.split("=")[1];
    }
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
