export class RESPEncoder {
  static encodeSimpleString(val: string): Buffer {
    return Buffer.from(`+${val}\r\n`);
  }

  static encodeError(message: string, prefix = "ERR"): Buffer {
    return Buffer.from(`-${prefix} ${message}\r\n`);
  }

  static encodeInteger(val: number): Buffer {
    return Buffer.from(`:${Math.floor(val)}\r\n`);
  }

  static encodeBulkString(val: string | Buffer | null | undefined): Buffer {
    if (val === null || val === undefined) {
      return Buffer.from("$-1\r\n");
    }

    const buf = Buffer.isBuffer(val) ? val : Buffer.from(String(val));
    const header = Buffer.from(`$${buf.length}\r\n`);
    const trailer = Buffer.from("\r\n");
    return Buffer.concat([header, buf, trailer]);
  }

  static encodeArray(arr: any[] | null): Buffer {
    if (arr === null) {
      return Buffer.from("*-1\r\n");
    }

    const header = Buffer.from(`*${arr.length}\r\n`);
    const buffers: Buffer[] = [header];

    for (const item of arr) {
      buffers.push(RESPEncoder.encodeValue(item));
    }

    return Buffer.concat(buffers);
  }

  static encodeValue(val: any): Buffer {
    if (val === null || val === undefined) {
      return RESPEncoder.encodeBulkString(null);
    }
    if (typeof val === "number") {
      return RESPEncoder.encodeInteger(val);
    }
    if (typeof val === "boolean") {
      return RESPEncoder.encodeInteger(val ? 1 : 0);
    }
    if (typeof val === "string" || Buffer.isBuffer(val)) {
      return RESPEncoder.encodeBulkString(val);
    }
    if (Array.isArray(val)) {
      return RESPEncoder.encodeArray(val);
    }
    if (val instanceof Error) {
      return RESPEncoder.encodeError(val.message);
    }

    return RESPEncoder.encodeBulkString(String(val));
  }

  static OK = Buffer.from("+OK\r\n");
  static PONG = Buffer.from("+PONG\r\n");
  static NULL_BULK = Buffer.from("$-1\r\n");
  static NULL_ARRAY = Buffer.from("*-1\r\n");
  static ZERO = Buffer.from(":0\r\n");
  static ONE = Buffer.from(":1\r\n");
}
