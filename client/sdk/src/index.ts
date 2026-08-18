import net from "node:net";
import tls from "node:tls";
import fs from "node:fs";
import path from "node:path";

export interface SayoDBClientOptions {
  host?: string;
  port?: number;
  timeout?: number;
  password?: string;
  tls?: boolean;
  insecure?: boolean;
  ca?: string;
  autoReconnect?: boolean;
}

export type RESPValue =
  | string
  | number
  | null
  | Error
  | RESPValue[];

interface PendingCommand {
  resolve: (val: any) => void;
  reject: (err: Error) => void;
}

export class SayoDBClient {
  private host: string;
  private port: number;
  private timeout: number;
  private password?: string;
  private tls: boolean;
  private insecure: boolean;
  private ca?: string;
  private socket: net.Socket | null = null;
  private connected = false;
  private buffer = Buffer.alloc(0);
  private queue: PendingCommand[] = [];

  constructor(options: SayoDBClientOptions = {}) {
    this.host = options.host || "127.0.0.1";
    this.port = options.port || 6380;
    this.timeout = options.timeout || 5000;
    this.password = options.password;
    this.tls = options.tls || false;
    this.insecure = options.insecure || false;
    this.ca = options.ca;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        return resolve();
      }

      const onConnect = async () => {
        this.connected = true;
        if (this.password) {
          try {
            const authRes = await this.auth(this.password);
            if (authRes !== "OK") {
              throw new Error(`Authentication failed: ${authRes}`);
            }
          } catch (err: any) {
            this.disconnect();
            return reject(err);
          }
        }
        resolve();
      };

      try {
        if (this.tls) {
          const caCert = this.ca ? fs.readFileSync(path.resolve(process.cwd(), this.ca)) : undefined;
          this.socket = tls.connect(
            {
              host: this.host,
              port: this.port,
              rejectUnauthorized: !this.insecure,
              ca: caCert,
            },
            onConnect
          );
        } else {
          this.socket = net.createConnection({ host: this.host, port: this.port }, onConnect);
        }
      } catch (err: any) {
        return reject(err);
      }

      this.socket.on("data", (chunk: Buffer) => this.onData(chunk));

      this.socket.on("error", (err: Error) => {
        if (!this.connected) {
          reject(err);
        } else {
          this.handleError(err);
        }
      });

      this.socket.on("close", () => {
        this.connected = false;
        this.socket = null;
        this.rejectAllPending(new Error("Connection closed"));
      });
    });
  }

  public disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.socket || !this.connected) {
        this.connected = false;
        this.socket = null;
        return resolve();
      }

      this.socket.once("close", () => {
        this.connected = false;
        this.socket = null;
        resolve();
      });

      this.socket.end();
      this.socket.destroy();
    });
  }

  public sendCommand(args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        return reject(new Error("SayoDBClient is not connected to server"));
      }

      const payload = this.encodeRESP(args);
      this.queue.push({ resolve, reject });
      this.socket.write(payload);
    });
  }

  public async auth(password: string): Promise<string> {
    return this.sendCommand(["AUTH", password]);
  }

  // --- Convenience Key-Value Database Methods ---

  public async set(key: string, value: string, ttlSeconds?: number): Promise<string> {
    const args = ["SET", key, value];
    if (ttlSeconds !== undefined) {
      args.push("EX", String(ttlSeconds));
    }
    return this.sendCommand(args);
  }

  public async store(key: string, value: string, ttlSeconds?: number): Promise<string> {
    return this.set(key, value, ttlSeconds);
  }

  public async get(key: string): Promise<string | null> {
    return this.sendCommand(["GET", key]);
  }

  public async fetch(key: string): Promise<string | null> {
    return this.get(key);
  }

  public async del(...keys: string[]): Promise<number> {
    return this.sendCommand(["DEL", ...keys]);
  }

  public async remove(...keys: string[]): Promise<number> {
    return this.del(...keys);
  }

  public async exists(...keys: string[]): Promise<number> {
    return this.sendCommand(["EXISTS", ...keys]);
  }

  public async check(...keys: string[]): Promise<number> {
    return this.exists(...keys);
  }

  public async incr(key: string): Promise<number> {
    return this.sendCommand(["INCR", key]);
  }

  public async add(key: string): Promise<number> {
    return this.incr(key);
  }

  public async decr(key: string): Promise<number> {
    return this.sendCommand(["DECR", key]);
  }

  public async subtract(key: string): Promise<number> {
    return this.decr(key);
  }

  public async expire(key: string, seconds: number): Promise<number> {
    return this.sendCommand(["EXPIRE", key, String(seconds)]);
  }

  public async ttl(key: string): Promise<number> {
    return this.sendCommand(["TTL", key]);
  }

  public async keys(pattern = "*"): Promise<string[]> {
    return this.sendCommand(["KEYS", pattern]);
  }

  public async list(pattern = "*"): Promise<string[]> {
    return this.keys(pattern);
  }

  public async flushdb(): Promise<string> {
    return this.sendCommand(["FLUSHDB"]);
  }

  public async wipe(): Promise<string> {
    return this.flushdb();
  }

  public async ping(msg?: string): Promise<string> {
    const args = msg ? ["PING", msg] : ["PING"];
    return this.sendCommand(args);
  }

  // --- JSON Schema & Structured Document Methods ---

  public async schemaSet(schemaName: string, definitionJsonStr: string): Promise<string> {
    return this.sendCommand(["SCHEMA", "SET", schemaName, definitionJsonStr]);
  }

  public async schemaGet(schemaName: string): Promise<string | null> {
    return this.sendCommand(["SCHEMA", "GET", schemaName]);
  }

  public async schemaList(): Promise<string[]> {
    return this.sendCommand(["SCHEMA", "LIST"]);
  }

  public async schemaDel(schemaName: string): Promise<number> {
    return this.sendCommand(["SCHEMA", "DEL", schemaName]);
  }

  public async setjson(key: string, data: any, options?: { schema?: string; ttlSeconds?: number }): Promise<string> {
    const jsonStr = typeof data === "string" ? data : JSON.stringify(data);
    const args = ["SETJSON", key];
    if (options?.schema) {
      args.push("SCHEMA", options.schema);
    }
    args.push(jsonStr);
    if (options?.ttlSeconds !== undefined) {
      args.push("EX", String(options.ttlSeconds));
    }
    return this.sendCommand(args);
  }

  public async getjson(key: string): Promise<any> {
    const raw = await this.sendCommand(["GETJSON", key]);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  // --- Semantic AI & LLM Vector Cache Methods ---

  public async semset(
    prompt: string,
    response: string,
    vector: Float32Array | number[] | string,
    options?: { ttlSeconds?: number; namespace?: string; tag?: string }
  ): Promise<string> {
    const args = ["SEMSET", prompt, response, "EMBEDDING"];
    if (typeof vector === "string") {
      args.push(vector);
    } else if (vector instanceof Float32Array || Array.isArray(vector)) {
      for (let i = 0; i < vector.length; i++) {
        args.push(String(vector[i]));
      }
    }

    if (options?.ttlSeconds !== undefined) {
      args.push("EX", String(options.ttlSeconds));
    }
    if (options?.namespace) {
      args.push("NS", options.namespace);
    }
    if (options?.tag) {
      args.push("TAG", options.tag);
    }

    return this.sendCommand(args);
  }

  public async semget(
    vector: Float32Array | number[] | string,
    options?: { threshold?: number; namespace?: string }
  ): Promise<string | null> {
    const args: string[] = ["SEMGET"];
    if (options?.threshold !== undefined) {
      args.push("THRESHOLD", String(options.threshold));
    }
    if (options?.namespace) {
      args.push("NS", options.namespace);
    }

    args.push("EMBEDDING");
    if (typeof vector === "string") {
      args.push(vector);
    } else if (vector instanceof Float32Array || Array.isArray(vector)) {
      for (let i = 0; i < vector.length; i++) {
        args.push(String(vector[i]));
      }
    }

    return this.sendCommand(args);
  }

  public async semsearch(
    vector: Float32Array | number[] | string,
    options?: { limit?: number; threshold?: number; namespace?: string }
  ): Promise<string[]> {
    const args: string[] = ["SEMSEARCH"];
    if (options?.limit !== undefined) {
      args.push("LIMIT", String(options.limit));
    }
    if (options?.threshold !== undefined) {
      args.push("THRESHOLD", String(options.threshold));
    }
    if (options?.namespace) {
      args.push("NS", options.namespace);
    }

    args.push("EMBEDDING");
    if (typeof vector === "string") {
      args.push(vector);
    } else if (vector instanceof Float32Array || Array.isArray(vector)) {
      for (let i = 0; i < vector.length; i++) {
        args.push(String(vector[i]));
      }
    }

    return this.sendCommand(args);
  }

  public async semflush(options?: { namespace?: string; tag?: string }): Promise<number> {
    const args = ["SEMFLUSH"];
    if (options?.namespace) {
      args.push("NS", options.namespace);
    }
    if (options?.tag) {
      args.push("TAG", options.tag);
    }
    return this.sendCommand(args);
  }

  public async semdel(prompt: string, namespace?: string): Promise<number> {
    const args = ["SEMDEL", prompt];
    if (namespace) {
      args.push("NS", namespace);
    }
    return this.sendCommand(args);
  }

  // --- Internal RESP Protocol Serialization & Parsing ---

  private encodeRESP(args: string[]): Buffer {
    let resp = `*${args.length}\r\n`;
    for (const arg of args) {
      const str = String(arg);
      resp += `$${Buffer.byteLength(str)}\r\n${str}\r\n`;
    }
    return Buffer.from(resp);
  }

  private onData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.buffer.length > 0) {
      const parsed = this.parseRESP();
      if (parsed === undefined) {
        break; // Incomplete payload, wait for next chunk
      }

      const pending = this.queue.shift();
      if (pending) {
        if (parsed instanceof Error) {
          pending.reject(parsed);
        } else {
          pending.resolve(parsed);
        }
      }
    }
  }

  private parseRESP(): any {
    if (this.buffer.length === 0) return undefined;

    const firstChar = String.fromCharCode(this.buffer[0]);
    const newlineIndex = this.buffer.indexOf("\r\n");
    if (newlineIndex === -1) return undefined;

    const line = this.buffer.toString("utf-8", 1, newlineIndex);

    switch (firstChar) {
      case "+": { // Simple String
        this.buffer = this.buffer.subarray(newlineIndex + 2);
        return line;
      }
      case "-": { // Error
        this.buffer = this.buffer.subarray(newlineIndex + 2);
        return new Error(line);
      }
      case ":": { // Integer
        this.buffer = this.buffer.subarray(newlineIndex + 2);
        return parseInt(line, 10);
      }
      case "$": { // Bulk String
        const len = parseInt(line, 10);
        if (len === -1) {
          this.buffer = this.buffer.subarray(newlineIndex + 2);
          return null;
        }

        const totalLen = newlineIndex + 2 + len + 2;
        if (this.buffer.length < totalLen) {
          return undefined; // Wait for full payload
        }

        const content = this.buffer.toString("utf-8", newlineIndex + 2, newlineIndex + 2 + len);
        this.buffer = this.buffer.subarray(totalLen);
        return content;
      }
      case "*": { // Array
        const count = parseInt(line, 10);
        if (count === -1) {
          this.buffer = this.buffer.subarray(newlineIndex + 2);
          return null;
        }

        // Fast slice header
        this.buffer = this.buffer.subarray(newlineIndex + 2);
        const arr: any[] = [];
        for (let i = 0; i < count; i++) {
          const elem = this.parseRESP();
          if (elem === undefined) {
            return undefined; // Rollback waiting for full array payload
          }
          arr.push(elem);
        }
        return arr;
      }
      default:
        this.buffer = Buffer.alloc(0);
        return new Error(`Unknown RESP header byte '${firstChar}'`);
    }
  }

  private handleError(err: Error): void {
    this.rejectAllPending(err);
  }

  private rejectAllPending(err: Error): void {
    while (this.queue.length > 0) {
      const pending = this.queue.shift();
      if (pending) {
        pending.reject(err);
      }
    }
  }
}

// --- Mongoose-style Schema & Model API ---

export type SchemaTypeDefinition =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ArrayConstructor
  | ObjectConstructor
  | {
      type: StringConstructor | NumberConstructor | BooleanConstructor | ArrayConstructor | ObjectConstructor;
      required?: boolean;
      default?: any;
      min?: number;
      max?: number;
    };

export interface SchemaDefinition {
  [key: string]: SchemaTypeDefinition;
}

export class Schema {
  public readonly definition: SchemaDefinition;

  constructor(definition: SchemaDefinition) {
    this.definition = definition;
  }

  public toJSONSchema(): Record<string, string> {
    const schemaJson: Record<string, string> = {};
    for (const [key, prop] of Object.entries(this.definition)) {
      if (typeof prop === "function") {
        schemaJson[key] = prop.name.toLowerCase();
      } else if (prop && typeof prop === "object" && prop.type) {
        schemaJson[key] = prop.type.name.toLowerCase();
      }
    }
    return schemaJson;
  }
}

export class Model<T = Record<string, any>> {
  public readonly name: string;
  public readonly schema: Schema;
  public readonly client: SayoDBClient;
  private schemaRegistered = false;

  constructor(name: string, schema: Schema, client: SayoDBClient) {
    this.name = name;
    this.schema = schema;
    this.client = client;
  }

  public async initSchema(): Promise<string> {
    if (this.schemaRegistered) return "OK";
    const jsonSchemaStr = JSON.stringify(this.schema.toJSONSchema());
    const res = await this.client.schemaSet(this.name, jsonSchemaStr);
    this.schemaRegistered = true;
    return res;
  }

  public async set(key: string, data: T, ttlSeconds?: number): Promise<string> {
    await this.initSchema();
    const fullKey = key.includes(":") ? key : `${this.name.toLowerCase()}:${key}`;
    return this.client.setjson(fullKey, data, { schema: this.name, ttlSeconds });
  }

  public async get(key: string): Promise<T | null> {
    const fullKey = key.includes(":") ? key : `${this.name.toLowerCase()}:${key}`;
    return this.client.getjson(fullKey);
  }

  public async del(key: string): Promise<number> {
    const fullKey = key.includes(":") ? key : `${this.name.toLowerCase()}:${key}`;
    return this.client.del(fullKey);
  }
}

// --- Default sayodb Singleton Manager (Mongoose Pattern) ---

class SayoDBManager {
  private defaultClient: SayoDBClient | null = null;
  private modelsMap: Map<string, Model<any>> = new Map();

  public Schema = Schema;

  public async connect(
    urlOrOptions?: string | SayoDBClientOptions,
    options: SayoDBClientOptions = {}
  ): Promise<SayoDBClient> {
    let opts: SayoDBClientOptions = {};
    if (typeof urlOrOptions === "string") {
      const rawUrl = urlOrOptions.startsWith("sayodb://") ? urlOrOptions.replace("sayodb://", "http://") : urlOrOptions;
      try {
        const parsedUrl = new URL(rawUrl);
        opts = {
          host: parsedUrl.hostname || "127.0.0.1",
          port: parseInt(parsedUrl.port, 10) || 6380,
          password: parsedUrl.searchParams.get("password") || options.password,
          ...options,
        };
      } catch {
        opts = options;
      }
    } else if (urlOrOptions) {
      opts = { ...urlOrOptions, ...options };
    } else {
      opts = options;
    }

    this.defaultClient = new SayoDBClient(opts);
    await this.defaultClient.connect();
    return this.defaultClient;
  }

  public async disconnect(): Promise<void> {
    if (this.defaultClient) {
      await this.defaultClient.disconnect();
      this.defaultClient = null;
    }
  }

  public get client(): SayoDBClient {
    if (!this.defaultClient) {
      throw new Error("sayodb client is not connected. Call sayodb.connect(...) first.");
    }
    return this.defaultClient;
  }

  public createClient(options: SayoDBClientOptions = {}): SayoDBClient {
    return new SayoDBClient(options);
  }

  public model<T = Record<string, any>>(name: string, schema: Schema): Model<T> {
    const modelInstance = new Model<T>(name, schema, this.client);
    this.modelsMap.set(name, modelInstance);
    return modelInstance;
  }

  // Convenient proxy methods to default client
  public set(key: string, value: string, ttlSeconds?: number): Promise<string> {
    return this.client.set(key, value, ttlSeconds);
  }

  public get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  public del(...keys: string[]): Promise<number> {
    return this.client.del(...keys);
  }

  public semset(
    prompt: string,
    response: string,
    vector: Float32Array | number[] | string,
    options?: { ttlSeconds?: number; namespace?: string; tag?: string }
  ): Promise<string> {
    return this.client.semset(prompt, response, vector, options);
  }

  public semget(
    vector: Float32Array | number[] | string,
    options?: { threshold?: number; namespace?: string }
  ): Promise<string | null> {
    return this.client.semget(vector, options);
  }

  public semsearch(
    vector: Float32Array | number[] | string,
    options?: { limit?: number; threshold?: number; namespace?: string }
  ): Promise<string[]> {
    return this.client.semsearch(vector, options);
  }
}

export const sayodb = new SayoDBManager();
export default sayodb;
