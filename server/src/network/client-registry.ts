import { ClientConnection } from "./connection.js";

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
}

export const clientRegistry = new ClientRegistry();
