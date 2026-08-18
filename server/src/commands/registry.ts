import { CommandDefinition, CommandContext } from "./base.js";
import { RESPEncoder } from "../protocol/encoder.js";
import { logger } from "../utils/logger.js";
import { safeComparePassword } from "../utils/security.js";
import { isProtectedModeActive, isLoopbackIP } from "../utils/network-security.js";
import { semanticStore, parseVectorInput } from "../engine/vector/index.js";
import { schemaRegistry } from "../engine/schema/index.js";
import { parseMemorySize } from "../config/loader.js";
import { ConnectionState } from "../network/connection.js";

export class CommandRegistry {
  private commands: Map<string, CommandDefinition> = new Map();

  constructor() {
    this.registerCoreCommands();
  }

  public register(cmd: CommandDefinition): void {
    this.commands.set(cmd.name.toUpperCase(), cmd);
  }

  public resolveCommandName(incomingCmd: string, renameMap: Record<string, string> = {}): string | null {
    const upperIncoming = incomingCmd.toUpperCase();

    // If upperIncoming is an original command that has been renamed or disabled in config
    if (upperIncoming in renameMap) {
      return null;
    }

    // Check if upperIncoming is a configured obfuscated target alias
    for (const [origCmd, newAlias] of Object.entries(renameMap)) {
      if (newAlias.toUpperCase() === upperIncoming) {
        if (newAlias === "") return null; // Disables command completely
        return origCmd.toUpperCase();
      }
    }

    return upperIncoming;
  }

  public dispatch(ctx: CommandContext): Buffer {
    // FSM Terminal State Guard
    if (ctx.client?.state === ConnectionState.DISCONNECTED) {
      return RESPEncoder.encodeError("Client connection is closed", "ERR");
    }

    const renameMap = ctx.client?.serverConfig?.renameCommands || {};
    const resolvedName = this.resolveCommandName(ctx.commandName, renameMap);

    if (!resolvedName) {
      return RESPEncoder.encodeError(`unknown command '${ctx.commandName}'`, "ERR");
    }

    const cmdName = resolvedName;

    // Protected Mode Interception Guard (Redis 3.2+ specification)
    const isClientLoopback = ctx.client.isLoopback ?? (ctx.client.remoteAddress ? isLoopbackIP(ctx.client.remoteAddress) : true);
    if (isProtectedModeActive(ctx.client.serverConfig) && !isClientLoopback) {
      const allowedCommands = new Set(["AUTH", "PING", "INFO", "QUIT", "HELP"]);
      if (!allowedCommands.has(cmdName)) {
        return RESPEncoder.encodeError(
          "sayoDB is running in protected mode because it is bound to 0.0.0.0 without a password. Queries from remote clients are blocked. To fix this, set a password via requirepass / SAYODB_PASSWORD or bind to 127.0.0.1.",
          "DENIED"
        );
      }
    }

    // Authentication Command Interception Guard (FSM UNAUTHENTICATED State)
    const requirePass = ctx.client.serverConfig.requirePass;
    if (requirePass && (!ctx.client.isAuthenticated || ctx.client.state === ConnectionState.UNAUTHENTICATED)) {
      if (cmdName !== "AUTH" && cmdName !== "PING" && cmdName !== "QUIT" && cmdName !== "HELP") {
        return RESPEncoder.encodeError("Authentication required.", "NOAUTH");
      }
    }

    const definition = this.commands.get(cmdName);

    if (!definition) {
      return RESPEncoder.encodeError(`unknown command '${ctx.commandName}'`, "ERR");
    }

    // Validate arity
    const argCount = ctx.args.length;
    if (definition.arity > 0 && argCount !== definition.arity - 1) {
      return RESPEncoder.encodeError(`wrong number of arguments for '${ctx.commandName}' command`, "ERR");
    }
    if (definition.arity < 0 && argCount < Math.abs(definition.arity) - 1) {
      return RESPEncoder.encodeError(`wrong number of arguments for '${ctx.commandName}' command`, "ERR");
    }

    try {
      return definition.handler(ctx);
    } catch (err: any) {
      logger.error({ err, command: ctx.commandName }, "Error executing command");
      return RESPEncoder.encodeError(err.message || "execution error");
    }
  }

  private registerCoreCommands(): void {
    // PING [message]
    const pingHandler: CommandDefinition = {
      name: "PING",
      arity: -1,
      handler: (ctx) => {
        if (ctx.args.length > 0) {
          return RESPEncoder.encodeBulkString(ctx.args[0]);
        }
        return RESPEncoder.PONG;
      },
    };
    this.register(pingHandler);

    // AUTH [username] password
    this.register({
      name: "AUTH",
      arity: -2,
      handler: (ctx) => {
        const requirePass = ctx.client.serverConfig.requirePass;
        if (!requirePass) {
          return RESPEncoder.encodeError("Client sent AUTH, but no password is set", "ERR");
        }

        // Support AUTH <password> (1 arg) or AUTH <username> <password> (2 args)
        const passwordInput = ctx.args.length >= 2 ? ctx.args[1] : ctx.args[0];

        if (safeComparePassword(passwordInput, requirePass)) {
          if (typeof (ctx.client as any).transitionTo === "function") {
            (ctx.client as any).transitionTo(ConnectionState.AUTHENTICATED);
          } else {
            ctx.client.isAuthenticated = true;
          }
          return RESPEncoder.OK;
        }

        return RESPEncoder.encodeError("invalid password", "ERR");
      },
    });

    // QUIT
    this.register({
      name: "QUIT",
      arity: 1,
      handler: (ctx) => {
        if (typeof (ctx.client as any).transitionTo === "function") {
          (ctx.client as any).transitionTo(ConnectionState.DISCONNECTED);
        }
        if (ctx.client.socket) {
          try {
            ctx.client.socket.write(RESPEncoder.OK);
          } catch {}
          ctx.client.socket.destroy();
        }
        return RESPEncoder.OK;
      },
    });

    // ECHO message
    this.register({
      name: "ECHO",
      arity: 2,
      handler: (ctx) => RESPEncoder.encodeBulkString(ctx.args[0]),
    });

    // COMMAND
    this.register({
      name: "COMMAND",
      arity: -1,
      handler: () => RESPEncoder.encodeArray([]),
    });

    // HELP
    const HELP_TEXT = `========================================================================
                      sayoDB Command Reference                          
========================================================================
  Plain-English Command    Standard Command        Example
  ---------------------    ----------------        -------
  STORE / PUT / SAVE       SET                     STORE user "Rahul"
  FETCH / READ / SHOW      GET                     FETCH user
  REMOVE / DELETE          DEL                     REMOVE user
  CHECK / HAS              EXISTS                  CHECK user
  LIST / FIND              KEYS                    LIST *
  INCREASE / ADD           INCR                    INCREASE visits
  DECREASE / SUBTRACT      DECR                    DECREASE visits
  TIMEOUT                  TTL                     TIMEOUT user
  WIPE / CLEARALL          FLUSHDB                 WIPE
  PING                     PING                    PING
  AUTH                     AUTH                    AUTH my_password

  ----------------------------------------------------------------------
  AI & Semantic Vector Cache Commands
  ----------------------------------------------------------------------
  SEMSET       SEMSET <prompt> <resp> EMBEDDING <v1 v2...> [EX sec] [NS ns]
  SEMGET       SEMGET [THRESHOLD 0.85] [NS ns] EMBEDDING <v1 v2...>
  SEMSEARCH    SEMSEARCH [LIMIT 5] [THRESHOLD 0.7] EMBEDDING <v1 v2...>
  SEMDEL       SEMDEL <prompt> [NS ns]
  SEMFLUSH     SEMFLUSH [NS ns] [TAG tag]

  ----------------------------------------------------------------------
  Engine-Level JSON Schema Validation Commands
  ----------------------------------------------------------------------
  SCHEMA       SCHEMA SET <name> <def_json> | GET <name> | DEL <name> | LIST
  SETJSON      SETJSON <key> [SCHEMA schema_name] <payload_json>
  GETJSON      GETJSON <key>

  ----------------------------------------------------------------------
  Password Setup & Authentication Guide
  ----------------------------------------------------------------------
  Server Password Setup:
    • Environment Var:  SAYODB_PASSWORD="your_password" pnpm dev
    • Command Line:     sayodb-server --requirepass "your_password"
    • Config File:      sayodb.conf -> requirepass "your_password"

  CLI Authentication:
    • Command Flag:     sayodb-cli -a "your_password"
    • Environment Var:  SAYODB_PASSWORD="your_password" sayodb-cli
    • Interactive REPL: AUTH "your_password"

  GUI Authentication:
    • Console Tab:      AUTH "your_password" in the terminal tab
========================================================================`;

    this.register({
      name: "HELP",
      arity: -1,
      handler: () => RESPEncoder.encodeBulkString(HELP_TEXT),
    });

    // INFO
    this.register({
      name: "INFO",
      arity: -1,
      handler: (ctx) => {
        const infoText = [
          "# Server",
          "sayodb_version:0.1.0",
          "process_id:" + process.pid,
          "tcp_port:" + ctx.client.serverConfig.port,
          "default_ttl:" + ctx.client.serverConfig.defaultTtl + "s",
          "",
          "# Keyspace",
          `db0:keys=${ctx.store.dbsize()},expires=0`,
        ].join("\r\n");
        return RESPEncoder.encodeBulkString(infoText);
      },
    });

    // DBSIZE
    this.register({
      name: "DBSIZE",
      arity: 1,
      handler: (ctx) => RESPEncoder.encodeInteger(ctx.store.dbsize()),
    });

    // CONFIG GET / CONFIG SET
    this.register({
      name: "CONFIG",
      arity: -2,
      isWrite: true,
      handler: (ctx) => {
        const subcommand = ctx.args[0].toUpperCase();
        const param = ctx.args[1] ? ctx.args[1].toLowerCase() : "";

        if (subcommand === "GET") {
          const config = ctx.client.serverConfig;
          const result: string[] = [];

          const appendPair = (key: string, val: string) => {
            result.push(key, val);
          };

          if (param === "*" || param === "maxconnections" || param === "maxclients") {
            appendPair("maxconnections", String(config.maxConnections));
          }
          if (param === "*" || param === "timeout") {
            appendPair("timeout", String(config.timeout));
          }
          if (param === "*" || param === "maxpayload" || param === "maxpayloadsize" || param === "maxpayload-size") {
            appendPair("maxpayload", String(config.maxPayloadSize));
          }
          if (param === "*" || param === "default-ttl" || param === "default_ttl") {
            appendPair("default-ttl", String(config.defaultTtl));
          }
          if (param === "*" || param === "protected-mode" || param === "protectedmode") {
            appendPair("protected-mode", config.protectedMode ? "yes" : "no");
          }
          if (param === "*" || param === "requirepass") {
            appendPair("requirepass", config.requirePass || "");
          }
          if (param === "*" || param === "rename-command" || param === "renamecommand" || param === "renamecommands") {
            appendPair("rename-command", JSON.stringify(config.renameCommands || {}));
          }

          return RESPEncoder.encodeArray(result);
        }

        if (subcommand === "SET") {
          if (ctx.args.length < 3) {
            return RESPEncoder.encodeError("wrong number of arguments for 'CONFIG SET' command");
          }

          const val = ctx.args[2];
          const config = ctx.client.serverConfig;

          switch (param) {
            case "maxconnections":
            case "maxclients": {
              const parsed = parseInt(val, 10);
              if (isNaN(parsed) || parsed <= 0) {
                return RESPEncoder.encodeError("Invalid maxconnections value");
              }
              config.maxConnections = parsed;
              break;
            }
            case "timeout": {
              const parsed = parseInt(val, 10);
              if (isNaN(parsed) || parsed < 0) {
                return RESPEncoder.encodeError("Invalid timeout value");
              }
              config.timeout = parsed;
              break;
            }
            case "maxpayload":
            case "maxpayloadsize":
            case "maxpayload-size": {
              const parsed = parseMemorySize(val);
              if (isNaN(parsed) || parsed <= 0) {
                return RESPEncoder.encodeError("Invalid maxpayload value");
              }
              config.maxPayloadSize = parsed;
              break;
            }
            case "default-ttl":
            case "default_ttl": {
              const parsed = parseInt(val, 10);
              if (isNaN(parsed) || parsed < 0) {
                return RESPEncoder.encodeError("Invalid default-ttl value");
              }
              config.defaultTtl = parsed;
              break;
            }
            case "protected-mode":
            case "protectedmode": {
              const p = val.toLowerCase();
              config.protectedMode = p === "yes" || p === "true" || p === "1";
              break;
            }
            case "requirepass": {
              config.requirePass = val;
              break;
            }
            default:
              return RESPEncoder.encodeError(`Unsupported CONFIG SET parameter '${param}'`);
          }

          return RESPEncoder.OK;
        }

        return RESPEncoder.encodeError(`Unknown CONFIG subcommand '${subcommand}'`);
      },
    });

    // FLUSHDB / WIPE / CLEARALL
    const flushHandler: CommandDefinition = {
      name: "FLUSHDB",
      arity: 1,
      isWrite: true,
      handler: (ctx) => {
        ctx.store.flushdb();
        return RESPEncoder.OK;
      },
    };
    this.register(flushHandler);
    this.register({ ...flushHandler, name: "FLUSHALL" });
    this.register({ ...flushHandler, name: "WIPE" });
    this.register({ ...flushHandler, name: "CLEARALL" });

    // SET / STORE / PUT / SAVE key value [EX seconds]
    const setHandler: CommandDefinition = {
      name: "SET",
      arity: -3,
      isWrite: true,
      handler: (ctx) => {
        const [key, value, opt, optVal] = ctx.args;
        let ttlMs: number | null = null;

        if (opt && opt.toUpperCase() === "EX" && optVal) {
          const sec = parseInt(optVal, 10);
          if (!isNaN(sec) && sec > 0) {
            ttlMs = sec * 1000;
          } else if (sec === 0 || sec === -1) {
            ttlMs = null; // Explicitly persistent
          }
        } else if (ctx.client.serverConfig.defaultTtl > 0) {
          // Apply default TTL (60s default) if not explicitly disabled
          ttlMs = ctx.client.serverConfig.defaultTtl * 1000;
        }

        ctx.store.set(key, value, "string", ttlMs);
        return RESPEncoder.OK;
      },
    };
    this.register(setHandler);
    this.register({ ...setHandler, name: "STORE" });
    this.register({ ...setHandler, name: "PUT" });
    this.register({ ...setHandler, name: "SAVE" });

    // GET / FETCH / READ / SHOW key
    const getHandler: CommandDefinition = {
      name: "GET",
      arity: 2,
      handler: (ctx) => {
        const val = ctx.store.get(ctx.args[0]);
        if (val === null) return RESPEncoder.NULL_BULK;
        return RESPEncoder.encodeBulkString(String(val));
      },
    };
    this.register(getHandler);
    this.register({ ...getHandler, name: "FETCH" });
    this.register({ ...getHandler, name: "READ" });
    this.register({ ...getHandler, name: "SHOW" });

    // MSET key value [key value ...]
    this.register({
      name: "MSET",
      arity: -3,
      isWrite: true,
      handler: (ctx) => {
        if (ctx.args.length % 2 !== 0) {
          return RESPEncoder.encodeError("wrong number of arguments for MSET");
        }
        const defaultTtlMs = ctx.client.serverConfig.defaultTtl > 0 ? ctx.client.serverConfig.defaultTtl * 1000 : null;
        for (let i = 0; i < ctx.args.length; i += 2) {
          ctx.store.set(ctx.args[i], ctx.args[i + 1], "string", defaultTtlMs);
        }
        return RESPEncoder.OK;
      },
    });

    // MGET key [key ...]
    this.register({
      name: "MGET",
      arity: -2,
      handler: (ctx) => {
        const results = ctx.args.map((key) => ctx.store.get(key));
        return RESPEncoder.encodeArray(results);
      },
    });

    // DEL / REMOVE / DELETE key [key ...]
    const delHandler: CommandDefinition = {
      name: "DEL",
      arity: -2,
      isWrite: true,
      handler: (ctx) => {
        let count = 0;
        for (const key of ctx.args) {
          if (ctx.store.delete(key)) count++;
        }
        return RESPEncoder.encodeInteger(count);
      },
    };
    this.register(delHandler);
    this.register({ ...delHandler, name: "REMOVE" });
    this.register({ ...delHandler, name: "DELETE" });

    // EXISTS / CHECK / HAS key [key ...]
    const existsHandler: CommandDefinition = {
      name: "EXISTS",
      arity: -2,
      handler: (ctx) => {
        let count = 0;
        for (const key of ctx.args) {
          if (ctx.store.exists(key)) count++;
        }
        return RESPEncoder.encodeInteger(count);
      },
    };
    this.register(existsHandler);
    this.register({ ...existsHandler, name: "CHECK" });
    this.register({ ...existsHandler, name: "HAS" });

    // TYPE key
    this.register({
      name: "TYPE",
      arity: 2,
      handler: (ctx) => {
        const obj = ctx.store.getRaw(ctx.args[0]);
        if (!obj) return RESPEncoder.encodeSimpleString("none");
        return RESPEncoder.encodeSimpleString(obj.type);
      },
    });

    // EXPIRE key seconds
    this.register({
      name: "EXPIRE",
      arity: 3,
      isWrite: true,
      handler: (ctx) => {
        const sec = parseInt(ctx.args[1], 10);
        if (isNaN(sec)) return RESPEncoder.encodeError("value is not an integer or out of range");

        const ok = ctx.store.expire(ctx.args[0], sec * 1000);
        return ok ? RESPEncoder.ONE : RESPEncoder.ZERO;
      },
    });

    // TTL / TIMEOUT key
    const ttlHandler: CommandDefinition = {
      name: "TTL",
      arity: 2,
      handler: (ctx) => {
        const ttlSec = ctx.store.ttl(ctx.args[0]);
        return RESPEncoder.encodeInteger(ttlSec);
      },
    };
    this.register(ttlHandler);
    this.register({ ...ttlHandler, name: "TIMEOUT" });

    // KEYS / LIST / FIND pattern
    const keysHandler: CommandDefinition = {
      name: "KEYS",
      arity: -1,
      handler: (ctx) => {
        const pattern = ctx.args.length > 0 ? ctx.args[0] : "*";
        const matched = ctx.store.keys(pattern);
        return RESPEncoder.encodeArray(matched);
      },
    };
    this.register(keysHandler);
    this.register({ ...keysHandler, name: "LIST" });
    this.register({ ...keysHandler, name: "FIND" });

    // INCR / INCREASE / ADD key
    const incrHandler: CommandDefinition = {
      name: "INCR",
      arity: 2,
      isWrite: true,
      handler: (ctx) => this.handleIncrBy(ctx, ctx.args[0], 1),
    };
    this.register(incrHandler);
    this.register({ ...incrHandler, name: "INCREASE" });
    this.register({ ...incrHandler, name: "ADD" });

    // DECR / DECREASE / SUBTRACT key
    const decrHandler: CommandDefinition = {
      name: "DECR",
      arity: 2,
      isWrite: true,
      handler: (ctx) => this.handleIncrBy(ctx, ctx.args[0], -1),
    };
    this.register(decrHandler);
    this.register({ ...decrHandler, name: "DECREASE" });
    this.register({ ...decrHandler, name: "SUBTRACT" });

    // INCRBY key increment
    this.register({
      name: "INCRBY",
      arity: 3,
      isWrite: true,
      handler: (ctx) => {
        const delta = parseInt(ctx.args[1], 10);
        if (isNaN(delta)) return RESPEncoder.encodeError("value is not an integer or out of range");
        return this.handleIncrBy(ctx, ctx.args[0], delta);
      },
    });

    // --- SEMANTIC AI & LLM CACHE COMMANDS ---
    this.registerSemanticCommands();
  }

  private handleIncrBy(ctx: CommandContext, key: string, delta: number): Buffer {
    const raw = ctx.store.get(key);
    let num = 0;

    if (raw !== null) {
      num = parseInt(String(raw), 10);
      if (isNaN(num)) {
        return RESPEncoder.encodeError("value is not an integer or out of range");
      }
    }

    num += delta;
    const defaultTtlMs = ctx.client.serverConfig.defaultTtl > 0 ? ctx.client.serverConfig.defaultTtl * 1000 : null;
    ctx.store.set(key, String(num), "string", defaultTtlMs);
    return RESPEncoder.encodeInteger(num);
  }

  private registerSemanticCommands(): void {
    // SEMSET prompt response EMBEDDING v1 v2 ... [EX sec] [NS ns] [TAG tag]
    this.register({
      name: "SEMSET",
      arity: -4,
      isWrite: true,
      handler: (ctx) => {
        const prompt = ctx.args[0];
        const response = ctx.args[1];
        let embeddingStart = 2;

        if (ctx.args[2] && ctx.args[2].toUpperCase() === "EMBEDDING") {
          embeddingStart = 3;
        }

        let ttlMs: number | null = null; // Vector items persist by default unless EX sec is specified
        let namespace = "default";
        let tag: string | undefined = undefined;

        const vectorArgs: string[] = [];

        for (let i = embeddingStart; i < ctx.args.length; i++) {
          const arg = ctx.args[i];
          const upper = arg.toUpperCase();

          if (upper === "EX" && i + 1 < ctx.args.length) {
            const sec = parseInt(ctx.args[i + 1], 10);
            if (!isNaN(sec) && sec > 0) ttlMs = sec * 1000;
            i++;
          } else if ((upper === "NS" || upper === "NAMESPACE") && i + 1 < ctx.args.length) {
            namespace = ctx.args[i + 1];
            i++;
          } else if (upper === "TAG" && i + 1 < ctx.args.length) {
            tag = ctx.args[i + 1];
            i++;
          } else {
            vectorArgs.push(arg);
          }
        }

        const rawVec = parseVectorInput(vectorArgs.join(" "));
        if (rawVec.length === 0) {
          return RESPEncoder.encodeError("invalid or empty embedding vector");
        }

        semanticStore.set(prompt, response, rawVec, namespace, tag, ttlMs);
        return RESPEncoder.OK;
      },
    });

    // SEMGET THRESHOLD 0.88 EMBEDDING v1 v2 ...
    this.register({
      name: "SEMGET",
      arity: -2,
      handler: (ctx) => {
        let threshold = 0.85;
        let namespace = "default";
        let embeddingStart = 0;

        for (let i = 0; i < ctx.args.length; i++) {
          const upper = ctx.args[i].toUpperCase();
          if (upper === "THRESHOLD" && i + 1 < ctx.args.length) {
            const val = parseFloat(ctx.args[i + 1]);
            if (!isNaN(val)) threshold = val;
            i++;
          } else if ((upper === "NS" || upper === "NAMESPACE") && i + 1 < ctx.args.length) {
            namespace = ctx.args[i + 1];
            i++;
          } else if (upper === "EMBEDDING") {
            embeddingStart = i + 1;
            break;
          } else {
            embeddingStart = i;
            break;
          }
        }

        const vectorArgs = ctx.args.slice(embeddingStart);
        const rawVec = parseVectorInput(vectorArgs.join(" "));
        if (rawVec.length === 0) {
          return RESPEncoder.encodeError("invalid or empty query embedding vector");
        }

        const matches = semanticStore.searchNearest(rawVec, threshold, namespace, 1);
        if (matches.length === 0 || !matches[0].hit || !matches[0].item) {
          return RESPEncoder.NULL_BULK;
        }

        return RESPEncoder.encodeBulkString(matches[0].item.response);
      },
    });

    // SEMSEARCH LIMIT 5 THRESHOLD 0.7 EMBEDDING v1 v2 ...
    this.register({
      name: "SEMSEARCH",
      arity: -2,
      handler: (ctx) => {
        let limit = 5;
        let threshold = 0.7;
        let namespace = "default";
        let embeddingStart = 0;

        for (let i = 0; i < ctx.args.length; i++) {
          const upper = ctx.args[i].toUpperCase();
          if (upper === "LIMIT" && i + 1 < ctx.args.length) {
            limit = parseInt(ctx.args[i + 1], 10) || 5;
            i++;
          } else if (upper === "THRESHOLD" && i + 1 < ctx.args.length) {
            threshold = parseFloat(ctx.args[i + 1]) || 0.7;
            i++;
          } else if ((upper === "NS" || upper === "NAMESPACE") && i + 1 < ctx.args.length) {
            namespace = ctx.args[i + 1];
            i++;
          } else if (upper === "EMBEDDING") {
            embeddingStart = i + 1;
            break;
          } else {
            embeddingStart = i;
            break;
          }
        }

        const vectorArgs = ctx.args.slice(embeddingStart);
        const rawVec = parseVectorInput(vectorArgs.join(" "));
        const matches = semanticStore.searchNearest(rawVec, threshold, namespace, limit);

        const results: string[] = [];
        for (const m of matches) {
          if (m.item) {
            results.push(`prompt: ${m.item.prompt} | score: ${m.similarity.toFixed(4)} | response: ${m.item.response}`);
          }
        }
        return RESPEncoder.encodeArray(results);
      },
    });

    // SEMFLUSH [NS namespace] [TAG tag]
    this.register({
      name: "SEMFLUSH",
      arity: -1,
      isWrite: true,
      handler: (ctx) => {
        let count = 0;
        if (ctx.args.length === 0) {
          count = semanticStore.size();
          semanticStore.flushAll();
        } else {
          for (let i = 0; i < ctx.args.length; i += 2) {
            const upper = ctx.args[i].toUpperCase();
            const val = ctx.args[i + 1];
            if (!val) break;
            if (upper === "NS" || upper === "NAMESPACE") {
              count += semanticStore.flushNamespace(val);
            } else if (upper === "TAG") {
              count += semanticStore.flushTag(val);
            }
          }
        }
        return RESPEncoder.encodeInteger(count);
      },
    });

    // SEMDEL prompt [NS namespace]
    this.register({
      name: "SEMDEL",
      arity: -2,
      isWrite: true,
      handler: (ctx) => {
        const prompt = ctx.args[0];
        const namespace = ctx.args[2] || "default";
        const ok = semanticStore.delete(prompt, namespace);
        return ok ? RESPEncoder.ONE : RESPEncoder.ZERO;
      },
    });

    // SCHEMA SET/GET/DEL/LIST
    this.register({
      name: "SCHEMA",
      arity: -2,
      isWrite: true,
      handler: (ctx) => {
        const subCmd = ctx.args[0].toUpperCase();
        if (subCmd === "SET") {
          if (ctx.args.length < 3) {
            return RESPEncoder.encodeError("wrong number of arguments for 'SCHEMA SET' command", "ERR");
          }
          const name = ctx.args[1];
          const definition = ctx.args[2];
          schemaRegistry.setSchema(name, definition);
          return RESPEncoder.OK;
        }

        if (subCmd === "GET") {
          if (ctx.args.length < 2) {
            return RESPEncoder.encodeError("wrong number of arguments for 'SCHEMA GET' command", "ERR");
          }
          const name = ctx.args[1];
          const schema = schemaRegistry.getSchema(name);
          if (!schema) return RESPEncoder.NULL_BULK;
          return RESPEncoder.encodeBulkString(JSON.stringify(schema.fields));
        }

        if (subCmd === "DEL" || subCmd === "DELETE") {
          if (ctx.args.length < 2) {
            return RESPEncoder.encodeError("wrong number of arguments for 'SCHEMA DEL' command", "ERR");
          }
          const name = ctx.args[1];
          const deleted = schemaRegistry.deleteSchema(name);
          return RESPEncoder.encodeInteger(deleted ? 1 : 0);
        }

        if (subCmd === "LIST") {
          return RESPEncoder.encodeArray(schemaRegistry.listSchemas());
        }

        return RESPEncoder.encodeError(`unknown sub-command '${subCmd}' for SCHEMA`, "ERR");
      },
    });

    // SETJSON key [SCHEMA schema_name] <payload_json>
    this.register({
      name: "SETJSON",
      arity: -3,
      isWrite: true,
      handler: (ctx) => {
        const key = ctx.args[0];

        if (ctx.args[1].toUpperCase() === "SCHEMA") {
          if (ctx.args.length < 4) {
            return RESPEncoder.encodeError("wrong number of arguments for 'SETJSON SCHEMA' command", "ERR");
          }
          const schemaName = ctx.args[2];
          const payloadStr = ctx.args.slice(3).join(" ");

          const result = schemaRegistry.validatePayload(schemaName, payloadStr);
          if (!result.valid) {
            return RESPEncoder.encodeError(result.error || "SchemaValidationError", "ERR");
          }

          ctx.store.set(key, payloadStr, "string");
          return RESPEncoder.OK;
        }

        const payloadStr = ctx.args.slice(1).join(" ");
        try {
          JSON.parse(payloadStr);
        } catch {
          return RESPEncoder.encodeError("SchemaValidationError: Invalid JSON syntax payload", "ERR");
        }

        ctx.store.set(key, payloadStr, "string");
        return RESPEncoder.OK;
      },
    });

    // GETJSON key
    this.register({
      name: "GETJSON",
      arity: 2,
      handler: (ctx) => {
        const val = ctx.store.get(ctx.args[0]);
        if (val === null || val === undefined) return RESPEncoder.NULL_BULK;
        return RESPEncoder.encodeBulkString(String(val));
      },
    });
  }
}

export const commandRegistry = new CommandRegistry();
