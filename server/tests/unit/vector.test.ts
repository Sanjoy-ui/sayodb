import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeVector,
  dotProduct,
  parseVectorInput,
  SemanticStore,
} from "../../src/engine/vector/index.js";

describe("Vector Math & Pre-Normalization Engine", () => {
  it("pre-normalizes raw vectors to unit vectors (||v|| = 1)", () => {
    const raw = new Float32Array([3, 4]);
    const normalized = normalizeVector(raw);

    // Magnitude should equal 1.0
    const mag = Math.sqrt(normalized[0] * normalized[0] + normalized[1] * normalized[1]);
    expect(mag).toBeCloseTo(1.0, 5);
    expect(normalized[0]).toBeCloseTo(0.6, 5);
    expect(normalized[1]).toBeCloseTo(0.8, 5);
  });

  it("calculates exact Cosine Similarity via Dot Product on unit vectors", () => {
    const v1 = normalizeVector(new Float32Array([1, 0, 0]));
    const v2 = normalizeVector(new Float32Array([1, 0, 0]));
    const v3 = normalizeVector(new Float32Array([0, 1, 0]));

    // Identical vectors -> Cosine Similarity = 1.0
    expect(dotProduct(v1, v2)).toBeCloseTo(1.0, 5);

    // Orthogonal vectors -> Cosine Similarity = 0.0
    expect(dotProduct(v1, v3)).toBeCloseTo(0.0, 5);
  });

  it("parses text numbers, Base64 packed Float32Array, and Buffer inputs", () => {
    // 1. Text space-separated floats
    const vec1 = parseVectorInput("0.5 0.5 0.5 0.5");
    expect(vec1.length).toBe(4);
    expect(vec1[0]).toBe(0.5);

    // 2. Binary Buffer Float32Array
    const floatArr = new Float32Array([0.1, 0.2, 0.3]);
    const buf = Buffer.from(floatArr.buffer);
    const vec2 = parseVectorInput(buf);
    expect(vec2.length).toBe(3);
    expect(vec2[0]).toBeCloseTo(0.1, 5);

    // 3. Base64 packed string
    const b64 = "base64:" + buf.toString("base64");
    const vec3 = parseVectorInput(b64);
    expect(vec3.length).toBe(3);
    expect(vec3[0]).toBeCloseTo(0.1, 5);
  });
});

describe("SemanticStore & Hybrid Invalidation", () => {
  let store: SemanticStore;

  beforeEach(() => {
    store = new SemanticStore();
  });

  it("stores and performs semantic lookup with cosine similarity threshold", () => {
    const vecA = new Float32Array([0.9, 0.1, 0.0]);
    const vecQueryHit = new Float32Array([0.88, 0.12, 0.0]);
    const vecQueryMiss = new Float32Array([0.0, 0.0, 1.0]);

    store.set("What is sayoDB?", "sayoDB is an in-memory database.", vecA, "ai-cache");

    // Query 1: High similarity -> Cache HIT
    const hitResult = store.searchNearest(vecQueryHit, 0.85, "ai-cache", 1);
    expect(hitResult.length).toBe(1);
    expect(hitResult[0].hit).toBe(true);
    expect(hitResult[0].item?.response).toBe("sayoDB is an in-memory database.");
    expect(hitResult[0].similarity).toBeGreaterThan(0.95);

    // Query 2: Unrelated query -> Cache MISS
    const missResult = store.searchNearest(vecQueryMiss, 0.85, "ai-cache", 1);
    expect(missResult.length).toBe(0);
  });

  it("supports tag-based and namespace-based hybrid invalidation", () => {
    const vec = new Float32Array([1, 0]);

    store.set("prompt1", "resp1", vec, "billing", "v1-docs");
    store.set("prompt2", "resp2", vec, "billing", "v2-docs");
    store.set("prompt3", "resp3", vec, "auth", "v1-docs");

    expect(store.size()).toBe(3);

    // Flush by tag "v1-docs"
    const flushedCount = store.flushTag("v1-docs");
    expect(flushedCount).toBe(2);
    expect(store.size()).toBe(1);

    // Remaining item should be prompt2 in billing
    const res = store.get("prompt2", "billing");
    expect(res?.response).toBe("resp2");
  });
});
