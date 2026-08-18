import { Socket } from "node:net";
import { RESPParser, PayloadTooLargeError } from "../protocol/parser.js";
import { SayoDBConfig } from "../config/schema.js";
import { mainStore } from "../engine/store.js";
import { commandRegistry } from "../commands/registry.js";
import { isLoopbackIP } from "../utils/network-security.js";
import { logger } from "../utils/logger.js";

export enum ConnectionState {
  UNAUTHENTICATED = "UNAUTHENTICATED",
  AUTHENTICATED = "AUTHENTICATED",
  DISCONNECTED = "DISCONNECTED",
}

export class ClientConnection {
  public readonly id: number;
  public readonly socket: Socket;
  public readonly serverConfig: SayoDBConfig;
  public readonly remoteAddress: string;
  public readonly isLoopback: boolean;
  private parser: RESPParser;
  public selectedDbIndex = 0;

  private _state: ConnectionState;

  private slowlorisTimer: NodeJS.Timeout | null = null;
  private readonly slowlorisTimeoutMs = 30000; // 30s deadline for completing partial commands

  constructor(id: number, socket: Socket, config: SayoDBConfig) {
    this.id = id;
    this.socket = socket;
    this.serverConfig = config;
    this.remoteAddress = socket.remoteAddress || "127.0.0.1";
    this.isLoopback = isLoopbackIP(this.remoteAddress);
    this.parser = new RESPParser(config.maxPayloadSize);

    this._state = config.requirePass ? ConnectionState.UNAUTHENTICATED : ConnectionState.AUTHENTICATED;

    this.setupListeners();
  }

  public get state(): ConnectionState {
    return this._state;
  }

  public get isAuthenticated(): boolean {
    return this._state === ConnectionState.AUTHENTICATED;
  }

  public set isAuthenticated(val: boolean) {
    if (val) {
      this.transitionTo(ConnectionState.AUTHENTICATED);
    } else {
      this.transitionTo(ConnectionState.UNAUTHENTICATED);
    }
  }

  public transitionTo(nextState: ConnectionState): boolean {
    if (this._state === nextState) return true;

    if (this._state === ConnectionState.DISCONNECTED) {
      logger.debug({ clientId: this.id, attempt: nextState }, "Rejected transition from terminal DISCONNECTED state");
      return false;
    }

    const prevState = this._state;
    this._state = nextState;
    logger.debug({ clientId: this.id, from: prevState, to: nextState }, "Client FSM state transition");

    if (nextState === ConnectionState.DISCONNECTED) {
      this.cleanup();
    }

    return true;
  }

  private setupListeners(): void {
    // Configure socket idle timeout if enabled (config.timeout > 0)
    if (this.serverConfig.timeout > 0) {
      this.socket.setTimeout(this.serverConfig.timeout * 1000);
      this.socket.on("timeout", () => this.onTimeout());
    }

    this.socket.on("data", (chunk: Buffer) => this.onData(chunk));
    this.socket.on("error", (err: Error) => this.onError(err));
    this.socket.on("close", () => this.cleanup());
  }

  private onTimeout(): void {
    logger.warn({ clientId: this.id, timeout: this.serverConfig.timeout }, "Client connection timed out due to inactivity");
    try {
      this.socket.write("-ERR connection timed out\r\n");
    } catch {}
    this.socket.destroy();
  }

  private isDisconnected(): boolean {
    return this._state === ConnectionState.DISCONNECTED;
  }

  private onData(chunk: Buffer): void {
    if (this.isDisconnected()) return;

    try {
      this.parser.append(chunk);

      while (!this.isDisconnected()) {
        const msg = this.parser.parseNext();
        if (!msg) break;

        const responseBuffer = commandRegistry.dispatch({
          store: mainStore,
          client: this,
          commandName: msg.name,
          args: msg.args,
        });

        if (!this.isDisconnected()) {
          this.socket.write(responseBuffer);
        }
      }

      // Check if partial buffer remains
      if (!this.isDisconnected() && this.parser.bufferLength > 0) {
        this.resetSlowlorisTimer();
      } else {
        this.clearSlowlorisTimer();
      }
    } catch (err: any) {
      if (err instanceof PayloadTooLargeError) {
        logger.warn({ clientId: this.id, err: err.message }, "Payload limit exceeded by client");
        try {
          this.socket.write("-ERR max request size exceeded\r\n");
        } catch {}
      } else {
        logger.error({ clientId: this.id, err: err.message }, "Error handling client payload");
      }
      this.transitionTo(ConnectionState.DISCONNECTED);
      this.socket.destroy();
    }
  }

  private resetSlowlorisTimer(): void {
    if (this.slowlorisTimer) return; // Keep existing deadline timer running

    this.slowlorisTimer = setTimeout(() => {
      if (this.parser.bufferLength > 0) {
        logger.warn(
          { clientId: this.id, bufferLen: this.parser.bufferLength },
          "Slowloris partial payload timeout triggered. Closing connection."
        );
        try {
          this.socket.write("-ERR slowloris timeout\r\n");
        } catch {}
        this.transitionTo(ConnectionState.DISCONNECTED);
        this.socket.destroy();
      }
    }, this.slowlorisTimeoutMs);
  }

  private clearSlowlorisTimer(): void {
    if (this.slowlorisTimer) {
      clearTimeout(this.slowlorisTimer);
      this.slowlorisTimer = null;
    }
  }

  private cleanup(): void {
    if (this._state !== ConnectionState.DISCONNECTED) {
      this._state = ConnectionState.DISCONNECTED;
    }
    this.clearSlowlorisTimer();
  }

  private onError(err: Error): void {
    this.cleanup();
    logger.error({ clientId: this.id, err: err.message }, "Client socket error");
  }
}
