import { MemoryStore } from "../engine/store.js";
import { ClientConnection } from "../network/connection.js";

export interface CommandContext {
  store: MemoryStore;
  client: ClientConnection;
  commandName: string;
  args: string[];
}

export type CommandHandler = (ctx: CommandContext) => Buffer;

export interface CommandDefinition {
  name: string;
  arity: number; // Positive = exact args count, Negative = minimum args count (-2 means >= 1 arg)
  handler: CommandHandler;
  isWrite?: boolean;
}
