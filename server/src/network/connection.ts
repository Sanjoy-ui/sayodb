import { Socket } from "node:net";
import { RESPParser } from "../protocol/parser.js";
import { SayoDBConfig } from "../config/schema.js";
import { mainStore } from "../engine/store.js";
import { commandRegistry } from "../commands/registry.js";
import { logger } from "../utils/logger.js";

export class ClientConnection {
  public readonly id: number;
  public readonly socket: Socket;
  public readonly serverConfig: SayoDBConfig;
  private parser = new RESPParser();
  public isAuthenticated = false;
  public selectedDbIndex = 0;

  constructor(id: number, socket: Socket, config: SayoDBConfig) {
    this.id = id;
    this.socket = socket;
    this.serverConfig = config;

    if (!config.requirePass) {
      this.isAuthenticated = true;
    }

    this.setupListeners();
  }

  private setupListeners(): void {
    this.socket.on("data", (chunk: Buffer) => this.onData(chunk));
    this.socket.on("error", (err: Error) => this.onError(err));
  }

  private onData(chunk: Buffer): void {
    this.parser.append(chunk);

    while (true) {
      const msg = this.parser.parseNext();
      if (!msg) break;

      const responseBuffer = commandRegistry.dispatch({
        store: mainStore,
        client: this,
        commandName: msg.name,
        args: msg.args,
      });

      this.socket.write(responseBuffer);
    }
  }

  private onError(err: Error): void {
    logger.error({ clientId: this.id, err: err.message }, "Client socket error");
  }
}
