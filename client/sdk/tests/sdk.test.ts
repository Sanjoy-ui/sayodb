import { describe, it, expect, beforeEach } from "vitest";
import sayodb, { SayoDBClient, Schema, Model } from "../src/index.js";

describe("sayoDB SDK & Mongoose-style API", () => {
  describe("Schema Definition & Serialization", () => {
    it("serializes schema definitions to sayoDB JSON schema format", () => {
      const userSchema = new Schema({
        name: { type: String, required: true },
        age: { type: Number, min: 0 },
        active: Boolean,
      });

      const jsonSchema = userSchema.toJSONSchema();
      expect(jsonSchema).toEqual({
        name: "string",
        age: "number",
        active: "boolean",
      });
    });

    it("supports constructor shorthand types", () => {
      const docSchema = new Schema({
        title: String,
        views: Number,
      });

      expect(docSchema.toJSONSchema()).toEqual({
        title: "string",
        views: "number",
      });
    });
  });

  describe("Model Class Construction", () => {
    it("instantiates Model with target schema and client", () => {
      const client = new SayoDBClient({ host: "127.0.0.1", port: 6380 });
      const schema = new Schema({ title: String });
      const PostModel = new Model("Post", schema, client);

      expect(PostModel.name).toBe("Post");
      expect(PostModel.schema).toBe(schema);
      expect(PostModel.client).toBe(client);
    });
  });

  describe("SayoDBManager Singleton Interface", () => {
    it("exposes Mongoose-style exports and Schema class", () => {
      expect(sayodb.Schema).toBe(Schema);
      expect(typeof sayodb.connect).toBe("function");
      expect(typeof sayodb.model).toBe("function");
    });

    it("throws clear error when accessing client before connect()", () => {
      expect(() => sayodb.client).toThrow("sayodb client is not connected");
    });
  });
});
