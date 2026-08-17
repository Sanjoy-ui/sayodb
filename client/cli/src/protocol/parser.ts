export enum RESPType {
  SimpleString = "+",
  Error = "-",
  Integer = ":",
  BulkString = "$",
  Array = "*",
}

export type RESPValue =
  | { type: RESPType.SimpleString; value: string }
  | { type: RESPType.Error; value: string }
  | { type: RESPType.Integer; value: number }
  | { type: RESPType.BulkString; value: string | null }
  | { type: RESPType.Array; value: RESPValue[] | null };

export class ClientRESPParser {
  private buffer: Buffer = Buffer.alloc(0);

  public append(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);
  }

  public parseNext(): RESPValue | null {
    if (this.buffer.length === 0) return null;

    const savedBuffer = this.buffer;
    const value = this.parseValue();

    if (value === null) {
      this.buffer = savedBuffer;
      return null;
    }

    return value;
  }

  private parseValue(): RESPValue | null {
    if (this.buffer.length === 0) return null;

    const typeChar = String.fromCharCode(this.buffer[0]);

    switch (typeChar) {
      case RESPType.SimpleString:
        return this.parseSimpleString();
      case RESPType.Error:
        return this.parseError();
      case RESPType.Integer:
        return this.parseInteger();
      case RESPType.BulkString:
        return this.parseBulkString();
      case RESPType.Array:
        return this.parseArray();
      default:
        return null;
    }
  }

  private readLine(): string | null {
    const crlfIndex = this.buffer.indexOf("\r\n");
    if (crlfIndex === -1) return null;

    const line = this.buffer.toString("utf-8", 1, crlfIndex);
    this.buffer = this.buffer.subarray(crlfIndex + 2);
    return line;
  }

  private parseSimpleString(): RESPValue | null {
    const line = this.readLine();
    if (line === null) return null;
    return { type: RESPType.SimpleString, value: line };
  }

  private parseError(): RESPValue | null {
    const line = this.readLine();
    if (line === null) return null;
    return { type: RESPType.Error, value: line };
  }

  private parseInteger(): RESPValue | null {
    const line = this.readLine();
    if (line === null) return null;
    return { type: RESPType.Integer, value: parseInt(line, 10) };
  }

  private parseBulkString(): RESPValue | null {
    const crlfIndex = this.buffer.indexOf("\r\n");
    if (crlfIndex === -1) return null;

    const lenStr = this.buffer.toString("utf-8", 1, crlfIndex);
    const length = parseInt(lenStr, 10);

    if (length === -1) {
      this.buffer = this.buffer.subarray(crlfIndex + 2);
      return { type: RESPType.BulkString, value: null };
    }

    const dataStart = crlfIndex + 2;
    const dataEnd = dataStart + length;

    if (this.buffer.length < dataEnd + 2) {
      return null;
    }

    const content = this.buffer.toString("utf-8", dataStart, dataEnd);
    this.buffer = this.buffer.subarray(dataEnd + 2);

    return { type: RESPType.BulkString, value: content };
  }

  private parseArray(): RESPValue | null {
    const crlfIndex = this.buffer.indexOf("\r\n");
    if (crlfIndex === -1) return null;

    const countStr = this.buffer.toString("utf-8", 1, crlfIndex);
    const count = parseInt(countStr, 10);

    if (count === -1) {
      this.buffer = this.buffer.subarray(crlfIndex + 2);
      return { type: RESPType.Array, value: null };
    }

    this.buffer = this.buffer.subarray(crlfIndex + 2);
    const items: RESPValue[] = [];

    for (let i = 0; i < count; i++) {
      const item = this.parseValue();
      if (item === null) return null;
      items.push(item);
    }

    return { type: RESPType.Array, value: items };
  }
}
