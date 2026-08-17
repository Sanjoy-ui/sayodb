import { describe, it, expect } from "vitest";
import { formatRESPValue } from "../src/formatter.js";
import { RESPType } from "../src/protocol/parser.js";

describe("CLI RESP Formatter", () => {
  it("formats simple string", () => {
    const formatted = formatRESPValue({ type: RESPType.SimpleString, value: "OK" });
    expect(formatted).toContain("OK");
  });

  it("formats error", () => {
    const formatted = formatRESPValue({ type: RESPType.Error, value: "ERR unknown command" });
    expect(formatted).toContain("ERR unknown command");
  });

  it("formats integer", () => {
    const formatted = formatRESPValue({ type: RESPType.Integer, value: 42 });
    expect(formatted).toContain("42");
  });

  it("formats bulk string", () => {
    const formatted = formatRESPValue({ type: RESPType.BulkString, value: "Rahul" });
    expect(formatted).toContain("Rahul");
  });

  it("formats null bulk string", () => {
    const formatted = formatRESPValue({ type: RESPType.BulkString, value: null });
    expect(formatted).toContain("(nil)");
  });

  it("formats array of items", () => {
    const formatted = formatRESPValue({
      type: RESPType.Array,
      value: [
        { type: RESPType.BulkString, value: "user:1" },
        { type: RESPType.BulkString, value: "user:2" },
      ],
    });
    expect(formatted).toContain("user:1");
    expect(formatted).toContain("user:2");
  });

  it("supports raw mode formatting", () => {
    const formatted = formatRESPValue(
      {
        type: RESPType.Array,
        value: [
          { type: RESPType.BulkString, value: "user:1" },
          { type: RESPType.BulkString, value: "user:2" },
        ],
      },
      true
    );
    expect(formatted).toBe("user:1\nuser:2\n");
  });
});

import { parseCommandArgs, cliCompleter } from "../src/index.js";

describe("CLI Argument Tokenizer", () => {
  it("parses unquoted arguments", () => {
    expect(parseCommandArgs("FETCH user")).toEqual(["FETCH", "user"]);
  });

  it("strips double quotes from quoted values", () => {
    expect(parseCommandArgs('STORE user "Rahul"')).toEqual(["STORE", "user", "Rahul"]);
  });

  it("handles spaces inside quotes", () => {
    expect(parseCommandArgs('STORE msg "Hello World"')).toEqual(["STORE", "msg", "Hello World"]);
  });
});

describe("CLI Tab Autocompleter", () => {
  it("autocompletes single matching command name", () => {
    const [hits, str] = cliCompleter("fetc");
    expect(hits).toEqual(["FETCH"]);
    expect(str).toBe("fetc");
  });

  it("returns multiple matching command candidates for prefix", () => {
    const [hits] = cliCompleter("S");
    expect(hits).toContain("STORE");
    expect(hits).toContain("SET");
    expect(hits).toContain("SAVE");
    expect(hits).toContain("SHOW");
    expect(hits).toContain("SUBTRACT");
  });

  it("does not autocomplete when typing arguments after space", () => {
    const [hits] = cliCompleter("STORE user ");
    expect(hits).toEqual([]);
  });
});
