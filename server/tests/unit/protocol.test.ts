import { describe, it, expect } from "vitest";
import { RESPParser } from "../../src/protocol/parser.js";
import { RESPEncoder } from "../../src/protocol/encoder.js";

describe("RESP Encoder", () => {
  it("encodes simple strings", () => {
    expect(RESPEncoder.encodeSimpleString("OK").toString()).toBe("+OK\r\n");
  });

  it("encodes errors", () => {
    expect(RESPEncoder.encodeError("Unknown command").toString()).toBe("-ERR Unknown command\r\n");
  });

  it("encodes integers", () => {
    expect(RESPEncoder.encodeInteger(42).toString()).toBe(":42\r\n");
  });

  it("encodes bulk strings", () => {
    expect(RESPEncoder.encodeBulkString("hello").toString()).toBe("$5\r\nhello\r\n");
    expect(RESPEncoder.encodeBulkString(null).toString()).toBe("$-1\r\n");
  });

  it("encodes arrays", () => {
    const encoded = RESPEncoder.encodeArray(["SET", "key", "val"]).toString();
    expect(encoded).toBe("*3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$3\r\nval\r\n");
  });
});

describe("RESP Parser", () => {
  it("parses simple inline commands", () => {
    const parser = new RESPParser();
    parser.append(Buffer.from("PING\r\n"));

    const msg = parser.parseNext();
    expect(msg).not.toBeNull();
    expect(msg?.name).toBe("PING");
    expect(msg?.args).toEqual([]);
  });

  it("parses RESP bulk string arrays", () => {
    const parser = new RESPParser();
    parser.append(Buffer.from("*3\r\n$3\r\nSET\r\n$4\r\nname\r\n$5\r\nRahul\r\n"));

    const msg = parser.parseNext();
    expect(msg).not.toBeNull();
    expect(msg?.name).toBe("SET");
    expect(msg?.args).toEqual(["name", "Rahul"]);
  });

  it("handles fragmented incoming TCP buffer chunks", () => {
    const parser = new RESPParser();
    parser.append(Buffer.from("*2\r\n$3\r\nGET\r\n$4\r\nuser"));

    let msg = parser.parseNext();
    expect(msg).toBeNull(); // Incomplete

    parser.append(Buffer.from("\r\n"));
    msg = parser.parseNext();
    expect(msg).not.toBeNull();
    expect(msg?.name).toBe("GET");
    expect(msg?.args).toEqual(["user"]);
  });
});
