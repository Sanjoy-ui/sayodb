import { CommandDefinition, CommandContext } from "./base.js";
import { RESPEncoder } from "../protocol/encoder.js";
import { logger } from "../utils/logger.js";

export class CommandRegistry {
  private commands: Map<string, CommandDefinition> = new Map();

  constructor() {
    this.registerCoreCommands();
  }

  public register(cmd: CommandDefinition): void {
    this.commands.set(cmd.name.toUpperCase(), cmd);
  }

  public dispatch(ctx: CommandContext): Buffer {
    const cmdName = ctx.commandName.toUpperCase();
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
}

export const commandRegistry = new CommandRegistry();
