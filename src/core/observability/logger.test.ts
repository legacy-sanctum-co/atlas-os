import { describe, expect, it } from "vitest";

import { createLogger, redact } from "./logger";

describe("redact", () => {
  it("redacts sensitive keys at any depth", () => {
    const result = redact({
      userId: "u1",
      password: "hunter2",
      nested: { apiKey: "sk-123", prompt: "who am I", ok: 1 },
      list: [{ token: "t" }, { fine: true }],
    }) as Record<string, unknown>;

    expect(result.userId).toBe("u1");
    expect(result.password).toBe("[redacted]");
    expect((result.nested as Record<string, unknown>).apiKey).toBe("[redacted]");
    expect((result.nested as Record<string, unknown>).prompt).toBe("[redacted]");
    expect((result.nested as Record<string, unknown>).ok).toBe(1);
    expect((result.list as Array<Record<string, unknown>>)[0]?.token).toBe("[redacted]");
    expect((result.list as Array<Record<string, unknown>>)[1]?.fine).toBe(true);
  });

  it("redacts message content and memory fields", () => {
    const result = redact({ content: "private", parts: [], memory: "x", embedding: [1] }) as Record<
      string,
      unknown
    >;
    expect(Object.values(result).every((value) => value === "[redacted]")).toBe(true);
  });
});

describe("createLogger", () => {
  it("emits JSON lines at or above the configured level with redaction", () => {
    const lines: string[] = [];
    const log = createLogger({ level: "info", sink: (line) => lines.push(line) });

    log.debug("hidden");
    log.info("visible", { email: "owner@example.com", route: "/" });

    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;
    expect(parsed.level).toBe("info");
    expect(parsed.msg).toBe("visible");
    expect(parsed.email).toBe("[redacted]");
    expect(parsed.route).toBe("/");
  });

  it("child loggers carry bindings", () => {
    const lines: string[] = [];
    const log = createLogger({ level: "debug", sink: (line) => lines.push(line) }).child({
      module: "identity",
    });
    log.warn("careful");
    expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({ module: "identity", level: "warn" });
  });
});
