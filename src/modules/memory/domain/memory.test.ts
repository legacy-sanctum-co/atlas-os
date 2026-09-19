import { describe, expect, it } from "vitest";

import { canTransition, embeddingSpaceId, memoryInputSchema } from "./memory";

describe("memory status transitions", () => {
  it("is ADD-only with supersession", () => {
    expect(canTransition("candidate", "active")).toBe(true);
    expect(canTransition("candidate", "rejected")).toBe(true);
    expect(canTransition("active", "superseded")).toBe(true);
    expect(canTransition("active", "candidate")).toBe(false);
    expect(canTransition("superseded", "active")).toBe(false);
    expect(canTransition("rejected", "active")).toBe(false);
  });
});

describe("memoryInputSchema", () => {
  it("applies defaults and bounds", () => {
    const parsed = memoryInputSchema.parse({ kind: "fact", content: "Owner is based in London" });
    expect(parsed.importance).toBe(0.5);
    expect(parsed.confidence).toBe(0.7);
    expect(parsed.entities).toEqual([]);
    expect(() => memoryInputSchema.parse({ kind: "fact", content: "x", importance: 2 })).toThrow();
  });
});

describe("embeddingSpaceId", () => {
  it("is provider:model:dimensions", () => {
    expect(
      embeddingSpaceId({
        provider: "openai",
        model: "text-embedding-3-small",
        modelVersion: null,
        dimensions: 1536,
      }),
    ).toBe("openai:text-embedding-3-small:1536");
  });
});
