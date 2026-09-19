import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import { FieldEncryption, fieldEncryptionFromEnv } from "./field-encryption";

const k1 = randomBytes(32).toString("base64");
const k2 = randomBytes(32).toString("base64");
const ctx = { table: "health_metric", column: "value", rowId: "row-1" };

describe("FieldEncryption", () => {
  it("round-trips plaintext", () => {
    const enc = new FieldEncryption({ keys: { v1: k1 }, current: "v1" });
    const value = enc.encrypt("resting hr 52", ctx);
    expect(value.v).toBe("v1");
    expect(enc.decrypt(value, ctx)).toBe("resting hr 52");
  });

  it("produces a different ciphertext and nonce for identical plaintext", () => {
    const enc = new FieldEncryption({ keys: { v1: k1 }, current: "v1" });
    const a = enc.encrypt("same", ctx);
    const b = enc.encrypt("same", ctx);
    expect(a.n).not.toBe(b.n);
    expect(a.c).not.toBe(b.c);
  });

  it("detects tampering with ciphertext", () => {
    const enc = new FieldEncryption({ keys: { v1: k1 }, current: "v1" });
    const value = enc.encrypt("secret", ctx);
    const tampered = { ...value, c: Buffer.from("xx" + value.c, "base64").toString("base64") };
    expect(() => enc.decrypt(tampered, ctx)).toThrow();
  });

  it("binds ciphertext to its row/column via AAD", () => {
    const enc = new FieldEncryption({ keys: { v1: k1 }, current: "v1" });
    const value = enc.encrypt("secret", ctx);
    expect(() => enc.decrypt(value, { ...ctx, rowId: "row-2" })).toThrow();
    expect(() => enc.decrypt(value, { ...ctx, column: "other" })).toThrow();
  });

  it("supports key rotation: decrypts old versions, writes with current", () => {
    const v1Only = new FieldEncryption({ keys: { v1: k1 }, current: "v1" });
    const old = v1Only.encrypt("legacy", ctx);

    const rotated = new FieldEncryption({ keys: { v1: k1, v2: k2 }, current: "v2" });
    expect(rotated.decrypt(old, ctx)).toBe("legacy");
    expect(rotated.needsRotation(old)).toBe(true);
    const fresh = rotated.encrypt("legacy", ctx);
    expect(fresh.v).toBe("v2");
    expect(rotated.needsRotation(fresh)).toBe(false);
  });

  it("rejects keys of the wrong length and unknown current version", () => {
    expect(() => new FieldEncryption({ keys: { v1: "short" }, current: "v1" })).toThrow(/32 bytes/);
    expect(() => new FieldEncryption({ keys: { v1: k1 }, current: "v2" })).toThrow(
      /not configured/,
    );
  });

  it("blind index is deterministic per key and differs from the encryption key", () => {
    const enc = new FieldEncryption({ keys: { v1: k1, v2: k2 }, current: "v1" });
    expect(enc.blindIndex("owner@example.com")).toBe(enc.blindIndex("owner@example.com"));
    expect(enc.blindIndex("owner@example.com")).not.toBe(enc.blindIndex("other@example.com"));
    expect(enc.blindIndex("owner@example.com", "v1")).not.toBe(
      enc.blindIndex("owner@example.com", "v2"),
    );
  });

  it("serializes and parses", () => {
    const enc = new FieldEncryption({ keys: { v1: k1 }, current: "v1" });
    const value = enc.encrypt("x", ctx);
    const text = FieldEncryption.serialize(value);
    expect(FieldEncryption.parse(text)).toEqual(value);
    expect(() => FieldEncryption.parse("nope")).toThrow();
  });

  it("builds from env only when a key is configured", () => {
    expect(fieldEncryptionFromEnv({ ATLAS_DATA_KEY_CURRENT: "v1" })).toBeNull();
    expect(
      fieldEncryptionFromEnv({ ATLAS_DATA_KEY_V1: k1, ATLAS_DATA_KEY_CURRENT: "v1" }),
    ).toBeInstanceOf(FieldEncryption);
  });
});
