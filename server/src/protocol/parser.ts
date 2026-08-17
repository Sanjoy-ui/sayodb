import { CommandMessage, RESPType, RESPValue } from "./types.js";

export class RESPParser {
  private buffer: Buffer = Buffer.alloc(0);

  public append(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);
  }

  public parseNext(): CommandMessage | null {
    if (this.buffer.length === 0) return null;

    // Check if simple inline command (starts with letter/digit instead of RESP prefix)
    const firstChar = String.fromCharCode(this.buffer[0]);
    if (!["+", "-", ":", "$", "*"].includes(firstChar)) {
      return this.parseInlineCommand();
    }

    const savedBuffer = this.buffer;
    const value = this.parseValue();

    if (value === null) {
      // Not enough data yet in buffer for a full RESP message
      this.buffer = savedBuffer;
      return null;
    }

    // Convert parsed RESPValue into a CommandMessage
    return this.valueToCommand(value);
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
      // Need more data
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
      if (item === null) {
        return null;
      }
      items.push(item);
    }

    return { type: RESPType.Array, value: items };
  }

  private parseInlineCommand(): CommandMessage | null {
    const crlfIndex = this.buffer.indexOf("\r\n");
    if (crlfIndex === -1) return null;

    const line = this.buffer.toString("utf-8", 0, crlfIndex).trim();
    this.buffer = this.buffer.subarray(crlfIndex + 2);

    if (!line) return null;

    const parts = line.split(/\s+/);
    const name = parts[0].toUpperCase();
    const args = parts.slice(1);

    return {
      name,
      args,
      raw: {
        type: RESPType.Array,
        value: parts.map((p) => ({ type: RESPType.BulkString, value: p })),
      },
    };
  }

  private valueToCommand(val: RESPValue): CommandMessage | null {
    if (val.type === RESPType.Array && Array.isArray(val.value) && val.value.length > 0) {
      const parts: string[] = [];
      for (const item of val.value) {
        if (item.type === RESPType.BulkString || item.type === RESPType.SimpleString) {
          parts.push(item.value || "");
        } else if (item.type === RESPType.Integer) {
          parts.push(String(item.value));
        }
      }

      if (parts.length > 0) {
        return {
          name: parts[0].toUpperCase(),
          args: parts.slice(1),
          raw: val,
        };
      }
    } else if (val.type === RESPType.SimpleString) {
      const parts = val.value.trim().split(/\s+/);
      return {
        name: parts[0].toUpperCase(),
        args: parts.slice(1),
        raw: val,
      };
    }

    return null;
  }
}
