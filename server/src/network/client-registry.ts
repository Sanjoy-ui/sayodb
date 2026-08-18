import { ClientConnection } from "./connection.js";
import { SayoDBConfig } from "../config/schema.js";

export class ClientRegistry {
  private clients: Map<number, ClientConnection> = new Map();
  private nextClientId = 1;

  public register(connection: ClientConnection): void {
    this.clients.set(connection.id, connection);
  }

  public unregister(id: number): void {
    this.clients.delete(id);
  }

  public generateId(): number {
    return this.nextClientId++;
  }

  public activeCount(): number {
    return this.clients.size;
  }

  public size(): number {
    return this.clients.size;
  }

  public getClientsInfo(config?: SayoDBConfig): Array<{
    id: number;
    remoteAddress: string;
    isAuthenticated: boolean;
    authStatus: "Authenticated" | "Unauthenticated" | "No Auth Required";
    isLoopback: boolean;
  }> {
    const hasPassword = Boolean(config?.requirePass && config.requirePass.trim().length > 0);

    return Array.from(this.clients.values()).map((c) => {
      let authStatus: "Authenticated" | "Unauthenticated" | "No Auth Required" = "No Auth Required";
      if (hasPassword) {
        authStatus = c.isAuthenticated ? "Authenticated" : "Unauthenticated";
      }

      return {
        id: c.id,
        remoteAddress: c.remoteAddress,
        isAuthenticated: c.isAuthenticated,
        authStatus,
        isLoopback: c.isLoopback,
      };
    });
  }
}

export const clientRegistry = new ClientRegistry();
