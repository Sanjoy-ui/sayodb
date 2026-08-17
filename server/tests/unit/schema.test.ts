import { describe, it, expect, beforeEach } from "vitest";
import { schemaRegistry } from "../../src/engine/schema/index.js";
import { commandRegistry } from "../../src/commands/registry.ts";
import { mainStore } from "../../src/engine/store.js";
import { CommandContext } from "../../src/commands/base.js";

describe("Engine-Level JSON Schema Validation", () => {
  beforeEach(() => {
    schemaRegistry.clear();
    mainStore.flushdb();
  });

  const dummyContext = (commandName: string, args: string[]): CommandContext => ({
    commandName,
    args,
    client: { serverConfig: {} } as any,
    store: mainStore,
  });

  it("should register concise and detailed schema definitions", () => {
    const rawDef = JSON.stringify({ name: "string", age: "number" });
    const schema = schemaRegistry.setSchema("user_schema", rawDef);

    expect(schema.name).toBe("user_schema");
    expect(schema.fields.name.type).toBe("string");
    expect(schema.fields.age.type).toBe("number");
    expect(schemaRegistry.listSchemas()).toContain("user_schema");
  });

  it("should validate payloads correctly against registered schema", () => {
    schemaRegistry.setSchema("user_schema", JSON.stringify({ name: "string", age: "number" }));

    // Valid payload
    const validRes = schemaRegistry.validatePayload("user_schema", JSON.stringify({ name: "Alice", age: 25 }));
    expect(validRes.valid).toBe(true);

    // Missing field
    const missingRes = schemaRegistry.validatePayload("user_schema", JSON.stringify({ name: "Alice" }));
    expect(missingRes.valid).toBe(false);
    expect(missingRes.error).toContain("Required field 'age' is missing");

    // Invalid type
    const invalidTypeRes = schemaRegistry.validatePayload("user_schema", JSON.stringify({ name: "Alice", age: "twenty" }));
    expect(invalidTypeRes.valid).toBe(false);
    expect(invalidTypeRes.error).toContain("'age' must be a number");
  });

  it("should handle SCHEMA command subcommands (SET, GET, DEL, LIST)", () => {
    // SCHEMA SET
    const setResp = commandRegistry.dispatch(dummyContext("SCHEMA", ["SET", "user_schema", '{"name":"string"}']));
    expect(setResp.toString()).toContain("+OK");

    // SCHEMA GET
    const getResp = commandRegistry.dispatch(dummyContext("SCHEMA", ["GET", "user_schema"]));
    expect(getResp.toString()).toContain("name");

    // SCHEMA LIST
    const listResp = commandRegistry.dispatch(dummyContext("SCHEMA", ["LIST"]));
    expect(listResp.toString()).toContain("user_schema");

    // SCHEMA DEL
    const delResp = commandRegistry.dispatch(dummyContext("SCHEMA", ["DEL", "user_schema"]));
    expect(delResp.toString()).toContain(":1");
  });

  it("should enforce schema validation during SETJSON execution", () => {
    // Register schema
    commandRegistry.dispatch(dummyContext("SCHEMA", ["SET", "user_schema", '{"name":"string","age":"number"}']));

    // SETJSON with invalid payload
    const invalidSet = commandRegistry.dispatch(
      dummyContext("SETJSON", ["user:101", "SCHEMA", "user_schema", '{"name":"Alice","age":"twenty"}'])
    );
    expect(invalidSet.toString()).toContain("SchemaValidationError");

    // Key should not be created
    expect(mainStore.exists("user:101")).toBe(false);

    // SETJSON with valid payload
    const validSet = commandRegistry.dispatch(
      dummyContext("SETJSON", ["user:101", "SCHEMA", "user_schema", '{"name":"Alice","age":25}'])
    );
    expect(validSet.toString()).toContain("+OK");

    // GETJSON should return valid payload
    const getResp = commandRegistry.dispatch(dummyContext("GETJSON", ["user:101"]));
    expect(getResp.toString()).toContain("Alice");
  });
});
