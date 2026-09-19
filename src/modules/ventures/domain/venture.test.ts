import { describe, expect, it } from "vitest";

import { projectInputSchema, slugify, uniqueSlug, ventureInputSchema } from "./venture";

describe("slugify", () => {
  it("normalizes names into url-safe slugs", () => {
    expect(slugify("Legacy Sanctum Co.")).toBe("legacy-sanctum-co");
    expect(slugify("  Atlas   OS — Phase 1 ")).toBe("atlas-os-phase-1");
    expect(slugify("Café Négocié")).toBe("cafe-negocie");
  });

  it("falls back for names without alphanumerics", () => {
    expect(slugify("!!!")).toBe("untitled");
  });

  it("caps length without trailing dashes", () => {
    const slug = slugify("a".repeat(80) + " tail");
    expect(slug.length).toBeLessThanOrEqual(64);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("uniqueSlug", () => {
  it("returns the base when free and suffixes when taken", () => {
    expect(uniqueSlug("atlas", new Set())).toBe("atlas");
    expect(uniqueSlug("atlas", new Set(["atlas"]))).toBe("atlas-2");
    expect(uniqueSlug("atlas", new Set(["atlas", "atlas-2"]))).toBe("atlas-3");
  });
});

describe("input schemas", () => {
  it("applies defaults and trims", () => {
    const venture = ventureInputSchema.parse({ name: "  Sanctum  " });
    expect(venture).toEqual({ name: "Sanctum", stage: "building", goals: [] });

    const project = projectInputSchema.parse({ name: "Site launch" });
    expect(project.status).toBe("active");
    expect(project.blockers).toEqual([]);
  });

  it("rejects empty names and invalid ids", () => {
    expect(() => ventureInputSchema.parse({ name: "   " })).toThrow();
    expect(() => projectInputSchema.parse({ name: "x", ventureId: "not-a-uuid" })).toThrow();
  });
});
