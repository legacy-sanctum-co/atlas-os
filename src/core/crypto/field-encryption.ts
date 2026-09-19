import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";

/**
 * Application-level field encryption (docs/SECURITY.md, ADR 0001).
 *
 * - AES-256-GCM, random 96-bit nonce per value, 128-bit auth tag.
 * - AAD binds ciphertext to its location (table:column:rowId) so a value
 *   cannot be moved between rows or columns undetected.
 * - Versioned keys: ciphertext carries the key version so rotation is
 *   "add v2, write with v2, lazily re-encrypt v1 on next write".
 * - Blind index: HMAC-SHA256 with a key derived via HKDF, for exact-match
 *   lookups on encrypted columns. Leaks equality only; use sparingly.
 *
 * Nothing in Phase 1 stores sensitive data yet; the helper exists so that
 * health/financial fields never land unencrypted when they arrive.
 */

export type KeyVersion = `v${number}`;

export interface FieldContext {
  table: string;
  column: string;
  rowId: string;
}

export interface EncryptedValue {
  /** Key version used to encrypt. */
  v: KeyVersion;
  /** Base64 nonce (12 bytes). */
  n: string;
  /** Base64 ciphertext. */
  c: string;
  /** Base64 auth tag (16 bytes). */
  t: string;
}

const NONCE_BYTES = 12;
const KEY_BYTES = 32;

export interface FieldEncryptionOptions {
  /** Map of key version → base64-encoded 256-bit key. */
  keys: Partial<Record<KeyVersion, string>>;
  /** Version used for new writes. Must exist in `keys`. */
  current: KeyVersion;
}

function decodeKey(version: KeyVersion, encoded: string | undefined): Buffer {
  if (!encoded) throw new Error(`Encryption key ${version} is not configured`);
  const key = Buffer.from(encoded, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `Encryption key ${version} must be ${KEY_BYTES} bytes (base64 of 32 random bytes)`,
    );
  }
  return key;
}

function aad(context: FieldContext): Buffer {
  return Buffer.from(`${context.table}:${context.column}:${context.rowId}`, "utf8");
}

export class FieldEncryption {
  private readonly keys = new Map<KeyVersion, Buffer>();
  private readonly blindIndexKeys = new Map<KeyVersion, Buffer>();
  readonly current: KeyVersion;

  constructor(options: FieldEncryptionOptions) {
    for (const [version, encoded] of Object.entries(options.keys) as Array<
      [KeyVersion, string | undefined]
    >) {
      if (!encoded) continue;
      const key = decodeKey(version, encoded);
      this.keys.set(version, key);
      // Separate HMAC key so blind indexes do not reuse the encryption key.
      this.blindIndexKeys.set(
        version,
        Buffer.from(hkdfSync("sha256", key, "", `atlas-blind-index:${version}`, KEY_BYTES)),
      );
    }
    if (!this.keys.has(options.current)) {
      throw new Error(`Current key version ${options.current} is not configured`);
    }
    this.current = options.current;
  }

  encrypt(plaintext: string, context: FieldContext): EncryptedValue {
    const key = this.keys.get(this.current);
    if (!key) throw new Error("Current encryption key missing");
    const nonce = randomBytes(NONCE_BYTES);
    const cipher = createCipheriv("aes-256-gcm", key, nonce);
    cipher.setAAD(aad(context));
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    return {
      v: this.current,
      n: nonce.toString("base64"),
      c: ciphertext.toString("base64"),
      t: cipher.getAuthTag().toString("base64"),
    };
  }

  decrypt(value: EncryptedValue, context: FieldContext): string {
    const key = this.keys.get(value.v);
    if (!key) throw new Error(`No key available for version ${value.v}`);
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(value.n, "base64"));
    decipher.setAAD(aad(context));
    decipher.setAuthTag(Buffer.from(value.t, "base64"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(value.c, "base64")),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  }

  /** True when the value was written with an older key and should be re-encrypted. */
  needsRotation(value: EncryptedValue): boolean {
    return value.v !== this.current;
  }

  /**
   * Deterministic index for exact-match lookups on encrypted columns.
   * Normalize (e.g. lowercase, trim) before calling; equality is all it offers.
   */
  blindIndex(normalizedValue: string, version: KeyVersion = this.current): string {
    const key = this.blindIndexKeys.get(version);
    if (!key) throw new Error(`No blind-index key for version ${version}`);
    return createHmac("sha256", key).update(normalizedValue, "utf8").digest("base64url");
  }

  /** Serialize for a text/jsonb column. */
  static serialize(value: EncryptedValue): string {
    return `${value.v}.${value.n}.${value.c}.${value.t}`;
  }

  static parse(serialized: string): EncryptedValue {
    const parts = serialized.split(".");
    if (parts.length !== 4) throw new Error("Malformed encrypted value");
    const [v, n, c, t] = parts as [string, string, string, string];
    if (!/^v\d+$/.test(v)) throw new Error("Malformed key version");
    return { v: v as KeyVersion, n, c, t };
  }
}

/** Build from environment; returns null when no key is configured. */
export function fieldEncryptionFromEnv(source: {
  ATLAS_DATA_KEY_V1?: string | undefined;
  ATLAS_DATA_KEY_CURRENT: string;
}): FieldEncryption | null {
  if (!source.ATLAS_DATA_KEY_V1) return null;
  return new FieldEncryption({
    keys: { v1: source.ATLAS_DATA_KEY_V1 },
    current: source.ATLAS_DATA_KEY_CURRENT as KeyVersion,
  });
}
